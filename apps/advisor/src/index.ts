import { createServer } from "./server/index.js";
import { createLogger } from "./logger.js";
import { defaultConfig } from "./config.js";
import { createChainReader } from "./chain/index.js";
import { createAdvisorWriterFromEnv } from "./chain/signer.js";
import { createBehaviorMonitor, createBehaviorStore } from "./behavior/index.js";
import { createPriceStore } from "./signal/store.js";
import { createSignalLoop } from "./signal/loop.js";
import { createExpiryWatcher } from "./signal/expiry-watcher.js";
import { createWalletExecutor } from "./execution/index.js";
import { createOnchainAggregator } from "./aggregation/index.js";
import { createAggregationWatcher } from "./aggregation/watcher.js";
import { createMessageStore } from "./messages/store.js";
import { generateInitialStrategy } from "./messages/auto-strategy.js";
import { createNotifier, getNotifierConfig } from "./alerts/notifier.js";
import { createTokenPriceStore, createPriceTracker } from "./prices/index.js";
import { createPublicClient, http } from "viem";
import type { McpDeps } from "./mcp/index.js";

const logger = createLogger();

async function main() {
  logger.info("Starting Aurex Advisor...");

  const config = defaultConfig;
  const reader = createChainReader(config.chain, config.contracts);

  const behaviorStore = createBehaviorStore("./data/behavior.db");
  const behavior = createBehaviorMonitor(config.behavior, behaviorStore);

  const priceStore = createPriceStore("./data/prices.db");

  const writer = await createAdvisorWriterFromEnv(config.chain, config.contracts);

  const poolIds: `0x${string}`[] = process.env.AUREX_POOL_IDS
    ? (process.env.AUREX_POOL_IDS.split(",") as `0x${string}`[])
    : process.env.POOL_ID
      ? [process.env.POOL_ID as `0x${string}`]
      : [];

  const messageStore = createMessageStore("./data/messages.db");
  const notifier = createNotifier(getNotifierConfig(), messageStore);

  const loop = writer
    ? createSignalLoop(reader, writer, priceStore, {
        poolIds,
        intervalMs: config.publisher.intervalMs,
        scoreChangeThreshold: config.publisher.scoreChangeThreshold,
        signalDurationMs: config.publisher.signalDurationMs,
        historyDepth: 50,
        pruneOlderThanMs: 7 * 24 * 60 * 60 * 1000,
        onAlert: (alert) => notifier.notify(alert),
      })
    : null;

  const executor = writer
    ? createWalletExecutor(reader, writer, config.contracts.poolManager, async (execution, results) => {
        const allSuccess = results.every(r => r.status === "success");
        if (!allSuccess || !loop) return;

        messageStore.save({
          type: "system",
          role: "assistant",
          content: `Trade executed: ${results.filter(r => r.status === "success").length}/${results.length} actions succeeded`,
          metadata: { executionId: execution.id, txHashes: results.map(r => r.txHash).filter(Boolean) },
        });

        const tickResults = await loop.tick();
        for (const tr of tickResults) {
          if (tr.published) {
            messageStore.save({
              type: "signal_alert",
              role: "assistant",
              content: `Strategy published on-chain for pool ${tr.poolId.slice(0, 10)}… — Risk: ${tr.scores.riskScore}, Alpha: ${tr.scores.alphaScore}`,
              metadata: { poolId: tr.poolId, txHash: tr.txHash, executionId: execution.id },
            });
          }
        }
      })
    : null;

  const publicClient = createPublicClient({ transport: http(config.chain.rpcUrl) });
  const aggregator = createOnchainAggregator(publicClient, {
    whaleThresholdWei: 100000000000000000000n,
    volumeAnomalyMultiplier: 3.0,
    priceDeviationThresholdBps: 50,
    lookbackBlocks: 100,
  });

  const tokenPriceStore = createTokenPriceStore("./data/token-prices.db");
  const priceTracker = createPriceTracker(reader, tokenPriceStore, {
    hotTokens: config.hotTokens,
    poolIds,
    intervalMs: 60_000,
    messageStore,
    onAlert: (alert) => notifier.notify(alert),
  });
  priceTracker.start();

  const aggregationWatcher = createAggregationWatcher(aggregator, reader, {
    tokens: config.hotTokens.filter(t => !t.startsWith("0x000000000")) as `0x${string}`[],
    poolManagerAddress: config.contracts.poolManager,
    poolIds,
    intervalMs: 120_000,
    onAlert: (alert) => notifier.notify(alert),
  });
  aggregationWatcher.start();

  const expiryWatcher = createExpiryWatcher(reader, messageStore, {
    poolIds,
    intervalMs: config.publisher.intervalMs,
  });
  expiryWatcher.start();

  const deps: McpDeps = {
    reader,
    writer,
    store: priceStore,
    loop,
    behavior,
    executor,
    aggregator,
    config,
    poolIds,
  };

  if (loop && config.publisher.enabled) {
    loop.start();
    logger.info(`Signal loop started (interval: ${config.publisher.intervalMs}ms, pools: ${poolIds.length})`);
  }

  await generateInitialStrategy({
    messageStore,
    reader,
    config,
    poolIds,
    hotTokens: config.hotTokens,
    walletAddress: writer?.getAddress(),
  });

  const onAlert = (alert: Parameters<typeof notifier.notify>[0]) => notifier.notify(alert);

  const server = await createServer({ ...deps, messageStore, notifier, onAlert, tokenPriceStore });

  const shutdown = async () => {
    logger.info("Shutting down...");
    loop?.stop();
    priceTracker.stop();
    aggregationWatcher.stop();
    expiryWatcher.stop();
    priceStore.close();
    tokenPriceStore.close();
    behaviorStore.close();
    messageStore.close();
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await server.listen({ host: config.server.host, port: config.server.port });
  logger.info(`Advisor running at http://${config.server.host}:${config.server.port}`);
  if (writer) {
    const signerInfo = writer.getSignerInfo?.();
    logger.info(`Publisher address: ${writer.getAddress()} (${signerInfo?.provider ?? "unknown"} signer)`);
  }
  if (!writer) logger.info("Read-only mode (set AUREX_PRIVATE_KEY or AUREX_SIGNER_PROVIDER=onchainos to enable publishing/execution)");
}

main().catch((err) => {
  logger.error(err, "Fatal error");
  process.exit(1);
});
