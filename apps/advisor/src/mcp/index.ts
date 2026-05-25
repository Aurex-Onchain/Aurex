import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { ChainReader } from "../chain/reader.js";
import type { ChainWriter } from "../chain/writer.js";
import type { PriceStore } from "../signal/store.js";
import type { SignalLoop } from "../signal/loop.js";
import type { BehaviorMonitor } from "../behavior/monitor.js";
import type { WalletExecutor } from "../execution/index.js";
import type { OnchainAggregator } from "../aggregation/index.js";
import type { AdvisorConfig, AurexSignal } from "../types.js";
import { assembleStrategy } from "./strategy.js";

export interface McpDeps {
  reader: ChainReader;
  writer: ChainWriter | null;
  store: PriceStore;
  loop: SignalLoop | null;
  behavior: BehaviorMonitor;
  executor: WalletExecutor | null;
  aggregator: OnchainAggregator | null;
  config: AdvisorConfig;
  poolIds: `0x${string}`[];
}

export function createMcpServer(deps: McpDeps): McpServer {
  const server = new McpServer({
    name: "aurex-advisor",
    version: "0.1.0",
  });

  server.tool(
    "advisor.market_status",
    "Get aggregated on-chain market status: pool states, active signals, publisher rankings",
    {},
    async () => {
      const { reader, poolIds } = deps;
      const pools = await Promise.all(
        poolIds.map(async (poolId) => {
          const [policy, latestSignal, signalValid, sqrtPriceX96] = await Promise.all([
            reader.getPoolPolicy(poolId).catch(() => null),
            reader.getLatestSignal(poolId).catch(() => null),
            reader.isSignalValid(poolId).catch(() => false),
            reader.getSlot0Price(poolId).catch(() => 0n),
          ]);
          return { poolId, policy, latestSignal, signalValid, sqrtPriceX96 };
        }),
      );

      const publisherCount = await reader.getPublisherCount().catch(() => 0n);
      const publishers = publisherCount > 0n
        ? await reader.getPublisherList(0n, publisherCount).catch(() => [])
        : [];

      const publisherInfos = await Promise.all(
        publishers.slice(0, 20).map(async (addr) => ({
          address: addr,
          info: await reader.getPublisherInfo(addr),
        })),
      );

      const result = {
        pools: pools.map((p) => ({
          ...p,
          sqrtPriceX96: p.sqrtPriceX96.toString(),
          policy: p.policy ? serializePolicy(p.policy) : null,
          latestSignal: p.latestSignal ? serializeSignal(p.latestSignal) : null,
        })),
        publishers: publisherInfos.map((p) => ({
          address: p.address,
          info: serializePublisherInfo(p.info),
        })),
        timestamp: Date.now(),
      };

      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
  server.tool(
    "advisor.get_strategy",
    "Get structured strategy context for AI reasoning: market state + user state + behavior alerts + scores",
    { user_address: z.string().optional().describe("User wallet address to include state for") },
    async ({ user_address }) => {
      const ctx = await assembleStrategy(deps, user_address as `0x${string}` | undefined);
      return { content: [{ type: "text" as const, text: JSON.stringify(ctx, null, 2) }] };
    },
  );

  server.tool(
    "advisor.publish_signal",
    "Manually trigger signal computation and publish for a specific pool",
    { pool_id: z.string().describe("Pool ID (bytes32 hex)") },
    async ({ pool_id }) => {
      if (!deps.writer) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "No private key configured, writer unavailable" }) }] };
      }
      if (!deps.loop) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Signal loop not initialized" }) }] };
      }
      const results = await deps.loop.tick();
      const result = results.find((r) => r.poolId === pool_id);
      if (!result) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Pool not in watched list" }) }] };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify({
        poolId: result.poolId,
        published: result.published,
        txHash: result.txHash ?? null,
        reason: result.reason,
        scores: {
          riskScore: result.scores.riskScore.toString(),
          alphaScore: result.scores.alphaScore.toString(),
          liquidityScore: result.scores.liquidityScore.toString(),
          volatilityScore: result.scores.volatilityScore.toString(),
          recommendedFee: result.scores.recommendedFee,
        },
      }, null, 2) }] };
    },
  );

  server.tool(
    "advisor.publisher_stats",
    "Get publisher statistics: accuracy, stake, signal count, claimable revenue",
    { address: z.string().optional().describe("Publisher address (defaults to Advisor's own address)") },
    async ({ address }) => {
      const { reader, writer, config } = deps;
      const pubAddr = (address ?? writer?.getAddress()) as `0x${string}` | undefined;
      if (!pubAddr) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "No address available" }) }] };
      }
      const info = await reader.getPublisherInfo(pubAddr);
      const claimable = await reader.getClaimable(pubAddr, config.contracts.aurexToken).catch(() => 0n);
      return { content: [{ type: "text" as const, text: JSON.stringify({
        address: pubAddr,
        ...serializePublisherInfo(info),
        claimable: claimable.toString(),
      }, null, 2) }] };
    },
  );

  server.tool(
    "advisor.risk_check",
    "Evaluate risk level for a proposed trade",
    {
      pool_id: z.string().describe("Pool ID to trade in"),
      direction: z.enum(["buy", "sell"]).describe("Trade direction"),
      size_percent: z.number().describe("Trade size as % of portfolio"),
    },
    async ({ pool_id, direction, size_percent }) => {
      const poolId = pool_id as `0x${string}`;
      const [signal, policy] = await Promise.all([
        deps.reader.getLatestSignal(poolId).catch(() => null),
        deps.reader.getPoolPolicy(poolId).catch(() => null),
      ]);

      const alerts: string[] = [];
      if (!signal) alerts.push("No active signal for this pool");
      if (signal && Number(signal.riskScore) > 70) alerts.push(`High risk score: ${signal.riskScore}`);
      if (policy?.blockHighRiskTrades && signal && Number(signal.riskScore) > Number(policy.maxRiskScore)) {
        alerts.push("Trade would be BLOCKED by pool policy (risk exceeds maxRiskScore)");
      }
      if (size_percent > deps.config.behavior.maxSingleTradePercent) {
        alerts.push(`Trade size ${size_percent}% exceeds max single trade threshold ${deps.config.behavior.maxSingleTradePercent}%`);
      }

      const behaviorStatus = deps.behavior.getStatus();
      if (behaviorStatus.level === "critical") alerts.push("Behavior indicator at CRITICAL level");

      return { content: [{ type: "text" as const, text: JSON.stringify({
        poolId,
        direction,
        sizePercent: size_percent,
        riskLevel: alerts.length === 0 ? "low" : alerts.length <= 2 ? "medium" : "high",
        alerts,
        signal: signal ? serializeSignal(signal) : null,
        behaviorLevel: behaviorStatus.level,
      }, null, 2) }] };
    },
  );

  server.tool(
    "advisor.behavior_alert",
    "Get current behavior risk status and active alerts",
    {},
    async () => {
      const status = deps.behavior.getStatus();
      return { content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }] };
    },
  );

  server.tool(
    "advisor.configure",
    "Update Advisor runtime configuration",
    {
      watched_pools: z.array(z.string()).optional().describe("Pool IDs to watch"),
      score_threshold: z.number().optional().describe("Score change threshold for auto-publish"),
      interval_ms: z.number().optional().describe("Auto-publish interval in ms"),
    },
    async ({ watched_pools, score_threshold, interval_ms }) => {
      const changes: string[] = [];
      if (watched_pools) {
        deps.poolIds.length = 0;
        deps.poolIds.push(...(watched_pools as `0x${string}`[]));
        changes.push(`watched_pools updated (${watched_pools.length} pools)`);
      }
      if (score_threshold !== undefined) {
        deps.config.publisher.scoreChangeThreshold = score_threshold;
        changes.push(`scoreChangeThreshold = ${score_threshold}`);
      }
      if (interval_ms !== undefined) {
        deps.config.publisher.intervalMs = interval_ms;
        changes.push(`intervalMs = ${interval_ms}`);
      }
      return { content: [{ type: "text" as const, text: JSON.stringify({ updated: changes }, null, 2) }] };
    },
  );

  server.tool(
    "advisor.onchain_data",
    "Fetch advanced on-chain data: whale movements, liquidity changes, volume anomalies, price deviations",
    {
      tokens: z.array(z.string()).optional().describe("Token addresses to monitor for whale movements"),
    },
    async ({ tokens }) => {
      if (!deps.aggregator) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Aggregator not available (read-only mode or no RPC)" }) }] };
      }
      const tokenAddrs = (tokens ?? [deps.config.contracts.aurexToken]) as `0x${string}`[];
      const result = await deps.aggregator.aggregate({
        tokens: tokenAddrs,
        poolManagerAddress: deps.config.contracts.poolManager,
        poolIds: deps.poolIds,
        historicalVolumes: new Map(),
        getPrices: (poolId) => deps.reader.getSlot0Price(poolId),
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({
        whaleMovements: result.whaleMovements.map((w) => ({
          from: w.from, to: w.to, value: w.value.toString(), token: w.token, txHash: w.txHash,
        })),
        liquidityChanges: result.liquidityChanges.map((l) => ({
          poolId: l.poolId, type: l.type, amount0: l.amount0.toString(), txHash: l.txHash,
        })),
        volumeAnomalies: result.volumeAnomalies.map((v) => ({
          poolId: v.poolId, currentVolume: v.currentVolume.toString(), averageVolume: v.averageVolume.toString(), ratio: v.ratio,
        })),
        priceDeviations: result.priceDeviations.map((p) => ({
          token: p.token, maxDeviationBps: p.maxDeviationBps, poolCount: p.pools.length,
        })),
        timestamp: result.timestamp,
      }, null, 2) }] };
    },
  );

  server.tool(
    "advisor.execute",
    "Propose and execute trading actions through Hook pools. Returns execution ID for confirmation flow.",
    {
      pool_id: z.string().describe("Pool ID (bytes32 hex)"),
      action_type: z.enum(["swap", "wait", "alert"]).describe("Action type"),
      direction: z.enum(["buy", "sell"]).optional().describe("Trade direction (for swap)"),
      amount: z.string().optional().describe("Amount in wei (for swap)"),
      token_in: z.string().optional().describe("Input token address (for swap)"),
      token_out: z.string().optional().describe("Output token address (for swap)"),
      confirm: z.boolean().optional().describe("Auto-confirm without waiting (default: false)"),
    },
    async ({ pool_id, action_type, direction, amount, token_in, token_out, confirm }) => {
      if (!deps.executor) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Executor not available (no private key configured)" }) }] };
      }

      if (action_type === "swap") {
        if (!direction || !amount || !token_in || !token_out) {
          return { content: [{ type: "text" as const, text: JSON.stringify({ error: "swap requires direction, amount, token_in, token_out" }) }] };
        }
        const execution = deps.executor.propose({
          actions: [{
            type: "swap",
            poolId: pool_id as `0x${string}`,
            tokenIn: token_in as `0x${string}`,
            tokenOut: token_out as `0x${string}`,
            amountIn: BigInt(amount),
            direction,
            maxSlippageBps: 50,
          }],
          confirmationRequired: !confirm,
        });

        if (confirm) {
          const results = await deps.executor.confirm(execution.id);
          return { content: [{ type: "text" as const, text: JSON.stringify({
            executionId: execution.id,
            status: "completed",
            results: results.map((r) => ({ status: r.status, txHash: r.txHash, error: r.error })),
          }, null, 2) }] };
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({
          executionId: execution.id,
          status: "awaiting_confirmation",
          message: "Call advisor.confirm_execution with this ID to execute",
        }, null, 2) }] };
      }

      if (action_type === "wait") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ action: "wait", status: "acknowledged" }) }] };
      }

      return { content: [{ type: "text" as const, text: JSON.stringify({ action: action_type, status: "acknowledged" }) }] };
    },
  );

  server.tool(
    "advisor.confirm_execution",
    "Confirm a pending execution proposal",
    { execution_id: z.string().describe("Execution ID from advisor.execute") },
    async ({ execution_id }) => {
      if (!deps.executor) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Executor not available" }) }] };
      }
      try {
        const results = await deps.executor.confirm(execution_id);
        return { content: [{ type: "text" as const, text: JSON.stringify({
          executionId: execution_id,
          status: "completed",
          results: results.map((r) => ({ status: r.status, txHash: r.txHash, error: r.error })),
        }, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) }] };
      }
    },
  );

  return server;
}

export async function startMcpStdio(deps: McpDeps): Promise<void> {
  const server = createMcpServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function serializeSignal(s: AurexSignal) {
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
