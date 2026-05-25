import { createServer } from "./server/index.js";
import { createLogger } from "./logger.js";
import { defaultConfig } from "./config.js";
import { createChainReader, createChainWriter } from "./chain/index.js";
import { createBehaviorMonitor, createBehaviorStore } from "./behavior/index.js";
import { createPriceStore } from "./signal/store.js";
import { createSignalLoop } from "./signal/loop.js";
import { createExpiryWatcher } from "./signal/expiry-watcher.js";
import { createWalletExecutor } from "./execution/index.js";
import { createOnchainAggregator } from "./aggregation/index.js";
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

  const privateKey = (process.env.AUREX_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}` | undefined;
  const writer = privateKey
    ? createChainWriter(config.chain, config.contracts, privateKey)
    : null;

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
    ? createWalletExecutor(reader, writer, config.contracts.poolManager)
    : null;

  const publicClient = createPublicClient({ transport: http(config.chain.rpcUrl) });
  const aggregator = createOnchainAggregator(publicClient);

  const tokenPriceStore = createTokenPriceStore("./data/token-prices.db");
  const priceTracker = createPriceTracker(reader, tokenPriceStore, {
    hotTokens: config.hotTokens,
    poolIds,
    intervalMs: 60_000,
    messageStore,
  });
  priceTracker.start();

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
  if (writer) logger.info(`Publisher address: ${writer.getAddress()}`);
  if (!writer) logger.info("Read-only mode (set AUREX_PRIVATE_KEY to enable publishing/execution)");
}

main().catch((err) => {
  logger.error(err, "Fatal error");
  process.exit(1);
});
