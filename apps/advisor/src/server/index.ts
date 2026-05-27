import Fastify from "fastify";
import cors from "@fastify/cors";
import type { McpDeps } from "../mcp/index.js";
import { assembleStrategy } from "../mcp/strategy.js";
import { generatePluginConfig } from "../plugins/index.js";
import { createChainWriter, createOnchainosChainWriter } from "../chain/index.js";
import { createSignalLoop } from "../signal/loop.js";
import { createWalletExecutor } from "../execution/index.js";
import type { MessageStore } from "../messages/store.js";
import type { Notifier, AlertContext } from "../alerts/notifier.js";
import type { TokenPriceStore } from "../prices/index.js";

interface ServerDeps extends McpDeps {
  messageStore: MessageStore;
  notifier: Notifier;
  onAlert?: (alert: AlertContext) => void | Promise<void>;
  tokenPriceStore?: TokenPriceStore;
}

export async function createServer(deps: ServerDeps) {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });

  app.get("/health", async () => ({
    status: "ok",
    timestamp: Date.now(),
    version: "0.1.0",
    loop: deps.loop?.isRunning() ?? false,
    publisher: deps.writer?.getAddress() ?? null,
  }));

  app.get("/api/market", async () => {
    const { reader, poolIds } = deps;
    const pools = await Promise.all(
      poolIds.map(async (poolId) => {
        const [policy, latestSignal, signalValid, sqrtPriceX96] = await Promise.all([
          reader.getPoolPolicy(poolId).catch(() => null),
          reader.getLatestSignal(poolId).catch(() => null),
          reader.isSignalValid(poolId).catch(() => false),
          reader.getSlot0Price(poolId).catch(() => 0n),
        ]);
        let verified: boolean | null = null;
        let slashed: boolean | null = null;
        if (latestSignal?.signalId) {
          const record = await reader.getSignalRecord(latestSignal.signalId).catch(() => null);
          if (record) {
            verified = record.verified;
            slashed = record.slashed;
          }
        }
        return {
          poolId,
          policy: policy ? serializePolicy(policy) : null,
          latestSignal: latestSignal ? serializeSignal(latestSignal) : null,
          signalValid,
          sqrtPriceX96: sqrtPriceX96.toString(),
          verified,
          slashed,
        };
      }),
    );
    return { pools, timestamp: Date.now() };
  });

  app.get<{ Querystring: { address?: string } }>("/api/strategy", async (request) => {
    const addr = request.query.address as `0x${string}` | undefined;
    const ctx = await assembleStrategy(deps, addr);
    return serializeContext(ctx);
  });

  app.get("/api/publisher", async () => {
    const { reader, writer, config } = deps;
    const addr = writer?.getAddress();
    if (!addr) return { address: null, info: null, claimable: null };
    const info = await reader.getPublisherInfo(addr).catch(() => null);
    const claimable = await reader.getClaimable(addr, config.contracts.aurexToken).catch(() => 0n);
    return {
      address: addr,
      info: info ? serializePublisherInfo(info) : null,
      claimable: claimable.toString(),
    };
  });

  app.get("/api/behavior", async () => {
    return deps.behavior.getStatus();
  });

  app.get("/api/aggregation", async () => {
    if (!deps.aggregator) return { error: "Aggregator not available" };
    const result = await deps.aggregator.aggregate({
      tokens: [deps.config.contracts.aurexToken],
      poolManagerAddress: deps.config.contracts.poolManager,
      poolIds: deps.poolIds,
      historicalVolumes: new Map(),
      getPrices: (poolId) => deps.reader.getSlot0Price(poolId),
    });
    return JSON.parse(JSON.stringify(result, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ));
  });
  app.get("/api/config", async () => {
    const signer = deps.writer?.getSignerInfo?.() ?? null;
    return {
      scoreChangeThreshold: deps.config.publisher.scoreChangeThreshold,
      intervalMs: deps.config.publisher.intervalMs,
      poolIds: deps.poolIds,
      hotTokens: deps.config.hotTokens,
      publisherAddress: deps.writer?.getAddress() ?? null,
      signer,
      hasPrivateKey: signer?.provider === "private-key",
      hasSigner: !!deps.writer,
    };
  });

  app.get<{ Querystring: { tokens?: string } }>("/api/prices", async (request) => {
    if (!deps.tokenPriceStore) return { error: "Price tracking not available" };
    const tokenFilter = request.query.tokens?.split(",").map((t) => t.trim().toLowerCase()) ?? null;
    const allTokens = [...deps.config.hotTokens, ...deps.poolIds];
    const tokens = tokenFilter ?? allTokens.map((t) => t.toLowerCase());
    const prices = tokens.map((token) => deps.tokenPriceStore!.getPriceChange(token)).filter(Boolean);
    return { prices, timestamp: Date.now() };
  });

  app.post<{ Body: { watched_pools?: string[]; score_threshold?: number; interval_ms?: number; private_key?: string; hot_tokens?: string[]; signer_provider?: "private-key" | "onchainos"; onchainos_address?: string; onchainos_auto_confirm?: boolean } }>("/api/configure", async (request) => {
    const { watched_pools, score_threshold, interval_ms, private_key, hot_tokens, signer_provider, onchainos_address, onchainos_auto_confirm } = request.body || {};
    const changes: string[] = [];
    function replaceWriter(newWriter: NonNullable<typeof deps.writer>) {
      deps.loop?.stop();
      deps.writer = newWriter;
      deps.loop = createSignalLoop(deps.reader, newWriter, deps.store, {
        poolIds: deps.poolIds,
        intervalMs: deps.config.publisher.intervalMs,
        scoreChangeThreshold: deps.config.publisher.scoreChangeThreshold,
        signalDurationMs: deps.config.publisher.signalDurationMs,
        historyDepth: 50,
        pruneOlderThanMs: 7 * 24 * 60 * 60 * 1000,
        onAlert: deps.onAlert,
      });
      deps.executor = createWalletExecutor(deps.reader, newWriter, deps.config.contracts.poolManager);
      if (deps.config.publisher.enabled) {
        deps.loop.start();
      }
    }

    if (watched_pools) {
      deps.poolIds.length = 0;
      deps.poolIds.push(...(watched_pools as `0x${string}`[]));
      changes.push(`watched_pools updated (${watched_pools.length} pools)`);
    }
    if (hot_tokens) {
      deps.config.hotTokens = hot_tokens as `0x${string}`[];
      changes.push(`hot_tokens updated (${hot_tokens.length} tokens)`);
    }
    if (score_threshold !== undefined) {
      deps.config.publisher.scoreChangeThreshold = score_threshold;
      changes.push(`scoreChangeThreshold = ${score_threshold}`);
    }
    if (interval_ms !== undefined) {
      deps.config.publisher.intervalMs = interval_ms;
      changes.push(`intervalMs = ${interval_ms}`);
    }
    if (signer_provider === "onchainos") {
      try {
        const newWriter = await createOnchainosChainWriter(deps.config.chain, deps.config.contracts, {
          address: (onchainos_address || undefined) as `0x${string}` | undefined,
          autoConfirm: onchainos_auto_confirm ?? false,
        });
        replaceWriter(newWriter);
        changes.push(`signer_provider = onchainos (publisher: ${newWriter.getAddress()})`);
      } catch (err) {
        return { success: false, error: `Failed to configure OnchainOS signer: ${err instanceof Error ? err.message : String(err)}` };
      }
    } else if (private_key) {
      try {
        const newWriter = createChainWriter(deps.config.chain, deps.config.contracts, private_key as `0x${string}`);
        replaceWriter(newWriter);
        changes.push(`signer_provider = private-key (publisher: ${newWriter.getAddress()})`);
      } catch (err) {
        return { success: false, error: `Invalid private key: ${err instanceof Error ? err.message : String(err)}` };
      }
    }
    return { success: true, changes };
  });

  app.post<{ Body: { pool_id: string } }>("/api/publish", async (request) => {
    if (!deps.writer) return { error: "No private key configured" };
    if (!deps.loop) return { error: "Signal loop not initialized" };
    const results = await deps.loop.tick();
    const result = results.find((r) => r.poolId === request.body?.pool_id);
    if (!result) return { error: "Pool not in watched list" };
    return {
      poolId: result.poolId,
      published: result.published,
      txHash: result.txHash ?? null,
      reason: result.reason,
    };
  });

  app.post<{ Body: { trade: { direction: "buy" | "sell"; sizePercent: number; asset: string; pnlPercent: number } } }>("/api/behavior/record", async (request) => {
    const { trade } = request.body || {};
    if (!trade) return { error: "Missing trade data" };
    deps.behavior.recordTrade({ ...trade, timestamp: Date.now() });
    return { recorded: true, status: deps.behavior.getStatus() };
  });

  app.post<{ Body: { pool_id: string; action_type: string; direction?: string; amount?: string; token_in?: string; token_out?: string; confirm?: boolean } }>("/api/execute", async (request) => {
    if (!deps.executor) return { error: "Executor not available (no private key configured)" };
    const { pool_id, action_type, direction, amount, token_in, token_out, confirm } = request.body || {};
    if (action_type === "swap") {
      if (!direction || !amount || !token_in || !token_out) return { error: "swap requires direction, amount, token_in, token_out" };
      const execution = deps.executor.propose({
        actions: [{
          type: "swap",
          poolId: pool_id as `0x${string}`,
          tokenIn: token_in as `0x${string}`,
          tokenOut: token_out as `0x${string}`,
          amountIn: BigInt(amount),
          direction: direction as "buy" | "sell",
          maxSlippageBps: 50,
        }],
        confirmationRequired: !confirm,
      });
      if (confirm) {
        const results = await deps.executor.confirm(execution.id);
        return { executionId: execution.id, status: "completed", results: results.map((r) => ({ status: r.status, txHash: r.txHash, error: r.error })) };
      }
      return { executionId: execution.id, status: "awaiting_confirmation" };
    }
    return { action: action_type, status: "acknowledged" };
  });

  app.post<{ Body: { execution_id: string } }>("/api/execute/confirm", async (request) => {
    if (!deps.executor) return { error: "Executor not available" };
    const { execution_id } = request.body || {};
    if (!execution_id) return { error: "Missing execution_id" };
    try {
      const results = await deps.executor.confirm(execution_id);
      return { executionId: execution_id, status: "completed", results: results.map((r) => ({ status: r.status, txHash: r.txHash, error: r.error })) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  });

  app.get("/api/execute/pending", async () => {
    if (!deps.executor) return { error: "Executor not available" };
    return { pending: deps.executor.getPending().map((e) => ({ id: e.id, status: e.status, createdAt: e.createdAt })) };
  });

  app.get<{ Querystring: { client: string } }>("/api/plugin", async (request) => {
    const client = request.query.client;
    const supportedClients = [
      "openclaw",
      "cursor",
      "hermes",
      "claude-code",
      "windsurf",
      "cline",
      "continue",
      "zed",
      "claude-desktop",
    ];
    if (!client || !supportedClients.includes(client)) {
      return {
        error: "Invalid client type",
        supported: supportedClients,
        usage: "GET /api/plugin?client=<type>",
      };
    }
    const baseUrl = `http://${deps.config.server.host}:${deps.config.server.port}`;
    return generatePluginConfig(client as any, baseUrl);
  });

  app.get<{ Querystring: { since?: string; limit?: string } }>("/api/messages", async (request) => {
    const since = request.query.since ? Number(request.query.since) : 0;
    const limit = request.query.limit ? Number(request.query.limit) : 50;
    const messages = deps.messageStore.list({ since, limit });
    return { messages };
  });

  app.post<{ Body: { type?: string; role?: string; content?: string; metadata?: Record<string, unknown> } }>("/api/messages/inbound", async (request) => {
    const { type = "recommendation", role = "assistant", content, metadata } = request.body || {};
    if (!content) return { error: "Missing content" };
    const msg = deps.messageStore.save({
      type: type as "recommendation" | "signal_alert" | "chat" | "strategy",
      role: role as "assistant" | "user",
      content,
      metadata: metadata ?? null,
    });
    return { message: msg };
  });

  app.post<{ Body: { content?: string } }>("/api/messages/chat", async (request) => {
    const { content } = request.body || {};
    if (!content) return { error: "Missing content" };

    const userMsg = deps.messageStore.save({
      type: "chat",
      role: "user",
      content,
      metadata: null,
    });

    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || "";
    const agentId = process.env.OPENCLAW_AGENT_ID || "main";
    if (gatewayToken) {
      try {
        await fetch(`${gatewayUrl}/hooks/agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${gatewayToken}`,
          },
          body: JSON.stringify({
            message: `[AUREX CHAT] User asks: ${content}\n\nRespond to the user. Call aurex.send_message with type="recommendation" to push a useful action to the feed (only if there's a concrete strategy worth recording). Use advisor.get_strategy and aurex.get_prices if you need market context first.`,
            agentId,
            wakeMode: "now",
            deliver: false,
          }),
        });
      } catch {}
    }

    return { message: userMsg };
  });

  app.post<{ Body: { content?: string } }>("/api/chat", async (request) => {
    const { content } = request.body || {};
    if (!content) return { error: "Missing content" };

    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || "";
    const agentId = process.env.OPENCLAW_AGENT_ID || "main";

    // Mode 1: OpenClaw Gateway (full AI)
    if (gatewayToken) {
      const beforeTimestamp = Date.now();

      try {
        const res = await fetch(`${gatewayUrl}/hooks/agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${gatewayToken}`,
          },
          body: JSON.stringify({
            message: `[AUREX CHAT] User asks: "${content}"\n\nYou MUST call the aurex.send_message tool with type="chat" to reply to the user. Include your analysis and any recommendations. Use aurex.get_strategy and aurex.get_prices for market context if needed.`,
            agentId,
            wakeMode: "now",
            deliver: false,
          }),
        });
        if (!res.ok) {
          return { error: `Gateway returned ${res.status}: ${await res.text()}` };
        }
      } catch (err) {
        return { error: `Failed to reach gateway: ${err instanceof Error ? err.message : String(err)}` };
      }

      // Poll message store for the AI reply (max 30s)
      const maxWait = 30_000;
      const pollInterval = 500;
      const deadline = Date.now() + maxWait;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, pollInterval));
        const recent = deps.messageStore.list({ since: beforeTimestamp, limit: 5 });
        const aiReply = recent.find((m) => m.role === "assistant" && m.createdAt > beforeTimestamp);
        if (aiReply) {
          return { reply: aiReply.content };
        }
      }

      return { reply: "AI is processing your request. Check the feed for updates." };
    }

    // Mode 2: Fallback (structured response without OpenClaw)
    try {
      const strategy = await assembleStrategy(deps);
      const response = generateFallbackResponse(content, strategy);

      deps.messageStore.save({
        type: "chat",
        role: "assistant",
        content: response,
        metadata: { mode: "fallback" },
      });

      return { reply: response };
    } catch (err) {
      return { reply: "Unable to generate response. Please check Advisor status." };
    }
  });

  return app;
}

function generateFallbackResponse(userQuery: string, strategy: any): string {
  const lower = userQuery.toLowerCase();
  const pools = strategy.market?.pools || [];

  if (lower.includes("risk") || lower.includes("风险")) {
    if (pools.length === 0) return "No pools are currently monitored.";
    const signals = pools.filter((p: any) => p.latestSignal);
    if (signals.length === 0) return "No active signals to assess risk.";
    const avgRisk = signals.reduce((sum: number, p: any) =>
      sum + Number(p.latestSignal?.riskScore || 0), 0) / signals.length;
    return `Current average risk score: ${avgRisk.toFixed(0)}/100. ${
      avgRisk > 60 ? "High risk detected across monitored pools." : "Risk levels are moderate."
    }`;
  }

  if (lower.includes("signal") || lower.includes("信号")) {
    const validSignals = pools.filter((p: any) => p.signalValid).length;
    return `${validSignals} valid signal${validSignals !== 1 ? 's' : ''} active across ${pools.length} pool${pools.length !== 1 ? 's' : ''}.`;
  }

  if (lower.includes("alpha") || lower.includes("机会")) {
    const signals = pools.filter((p: any) => p.latestSignal && p.signalValid);
    if (signals.length === 0) return "No active signals with alpha data.";
    const avgAlpha = signals.reduce((sum: number, p: any) =>
      sum + Number(p.latestSignal?.alphaScore || 0), 0) / signals.length;
    return `Average alpha score: ${avgAlpha.toFixed(0)}/100. ${
      avgAlpha > 60 ? "Good opportunities detected." : "Limited alpha opportunities currently."
    }`;
  }

  // Default: market summary
  const validSignals = pools.filter((p: any) => p.signalValid).length;
  return `Market Overview: ${pools.length} pool${pools.length !== 1 ? 's' : ''} monitored, ${validSignals} active signal${validSignals !== 1 ? 's' : ''}. For advanced AI analysis, configure OpenClaw Gateway in Advisor settings.`;
}

function serializeSignal(s: { signalId: string; poolId: string; riskScore: bigint; alphaScore: bigint; liquidityScore: bigint; volatilityScore: bigint; recommendedFee: number; expiresAt: bigint; signer: string }) {
  return {
    signalId: s.signalId,
    poolId: s.poolId,
    riskScore: s.riskScore.toString(),
    alphaScore: s.alphaScore.toString(),
    liquidityScore: s.liquidityScore.toString(),
    volatilityScore: s.volatilityScore.toString(),
    recommendedFee: s.recommendedFee,
    expiresAt: s.expiresAt.toString(),
    signer: s.signer,
  };
}

function serializePublisherInfo(info: { stakeAmount: bigint; signalCount: bigint; accuracyScore: bigint; slashCount: bigint; registeredAt: bigint; active: boolean }) {
  return {
    stakeAmount: info.stakeAmount.toString(),
    signalCount: info.signalCount.toString(),
    accuracyScore: info.accuracyScore.toString(),
    slashCount: info.slashCount.toString(),
    registeredAt: info.registeredAt.toString(),
    active: info.active,
  };
}

function serializePolicy(p: { maxRiskScore: bigint; minLiquidityScore: bigint; defaultFee: number; maxFee: number; publisherShareBps: number; blockHighRiskTrades: boolean; allowSwapWhenSignalExpired: boolean; policyAdmin: string }) {
  return {
    maxRiskScore: p.maxRiskScore.toString(),
    minLiquidityScore: p.minLiquidityScore.toString(),
    defaultFee: p.defaultFee,
    maxFee: p.maxFee,
    publisherShareBps: p.publisherShareBps,
    blockHighRiskTrades: p.blockHighRiskTrades,
    allowSwapWhenSignalExpired: p.allowSwapWhenSignalExpired,
    policyAdmin: p.policyAdmin,
  };
}

function serializeContext(ctx: { market: unknown; userState: unknown; behaviorStatus: unknown; timestamp: number }) {
  return JSON.parse(JSON.stringify(ctx, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  ));
}
