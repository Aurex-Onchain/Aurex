import type { McpDeps } from "./index.js";
import type { StrategyContext, MarketStatus, PoolStatus, UserState, PublisherSummary, OnchainDataSummary } from "../types.js";

export async function assembleStrategy(
  deps: McpDeps,
  userAddress?: `0x${string}`,
): Promise<StrategyContext> {
  const { reader, config, poolIds, behavior, aggregator } = deps;

  const pools: PoolStatus[] = await Promise.all(
    poolIds.map(async (poolId) => {
      const [policy, latestSignal, signalValid, sqrtPriceX96] = await Promise.all([
        reader.getPoolPolicy(poolId).catch(() => null),
        reader.getLatestSignal(poolId).catch(() => null),
        reader.isSignalValid(poolId).catch(() => false),
        reader.getSlot0Price(poolId).catch(() => 0n),
      ]);
      return {
        poolId,
        policy: policy!,
        latestSignal,
        signalValid,
        sqrtPriceX96,
      };
    }),
  );

  const publisherCount = await reader.getPublisherCount().catch(() => 0n);
  const publisherAddrs = publisherCount > 0n
    ? await reader.getPublisherList(0n, BigInt(Math.min(Number(publisherCount), 20))).catch(() => [])
    : [];

  let publishers: PublisherSummary[] = await Promise.all(
    publisherAddrs.map(async (address) => ({
      address: address as `0x${string}`,
      info: await reader.getPublisherInfo(address),
    })),
  );

  if (publishers.length === 0 && deps.writer) {
    const addr = deps.writer.getAddress();
    const info = await reader.getPublisherInfo(addr).catch(() => null);
    if (info) {
      publishers = [{ address: addr, info }];
    }
  }

  const market: MarketStatus = { pools, publishers, timestamp: Date.now() };

  let userState: UserState | null = null;
  if (userAddress) {
    const [aurexBalance, publisherInfo] = await Promise.all([
      reader.getTokenBalance(config.contracts.aurexToken, userAddress).catch(() => 0n),
      reader.getPublisherInfo(userAddress).catch(() => null),
    ]);

    const claimable = await reader.getClaimable(userAddress, config.contracts.aurexToken).catch(() => 0n);

    userState = {
      address: userAddress,
      balances: [{ token: config.contracts.aurexToken, symbol: "AUREX", balance: aurexBalance }],
      publisherInfo,
      claimable: claimable > 0n
        ? [{ token: config.contracts.aurexToken, symbol: "AUREX", balance: claimable }]
        : [],
    };
  }

  const behaviorStatus = behavior.getStatus();

  let onchainData: OnchainDataSummary | null = null;
  if (aggregator) {
    try {
      const agg = await aggregator.aggregate({
        tokens: [config.contracts.aurexToken],
        poolManagerAddress: config.contracts.poolManager,
        poolIds,
        historicalVolumes: new Map(),
        getPrices: (poolId) => reader.getSlot0Price(poolId),
      });
      onchainData = {
        whaleMovementCount: agg.whaleMovements.length,
        liquidityChangeCount: agg.liquidityChanges.length,
        volumeAnomalies: agg.volumeAnomalies.map((v) => ({ poolId: v.poolId, ratio: v.ratio })),
        priceDeviations: agg.priceDeviations.map((p) => ({ token: p.token as `0x${string}`, maxDeviationBps: p.maxDeviationBps })),
      };
    } catch {
      onchainData = null;
    }
  }

  return { market, userState, behaviorStatus, onchainData, timestamp: Date.now() };
}
