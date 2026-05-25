import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOnchainAggregator, defaultAggregatorConfig, type OnchainAggregator } from "../src/aggregation/index.js";
import type { PublicClient } from "viem";

function createMockClient(): PublicClient {
  return {
    getBlockNumber: vi.fn().mockResolvedValue(10000n),
    getLogs: vi.fn().mockResolvedValue([]),
  } as unknown as PublicClient;
}

const WETH = "0x1111111111111111111111111111111111111111" as `0x${string}`;
const POOL_ID = "0x3333333333333333333333333333333333333333333333333333333333333333" as `0x${string}`;
const POOL_MANAGER = "0x4444444444444444444444444444444444444444" as `0x${string}`;

describe("OnchainAggregator", () => {
  let client: PublicClient;
  let aggregator: OnchainAggregator;

  beforeEach(() => {
    client = createMockClient();
    aggregator = createOnchainAggregator(client, defaultAggregatorConfig);
  });

  it("fetchWhaleMovements returns empty when no large transfers", async () => {
    const result = await aggregator.fetchWhaleMovements([WETH]);
    expect(result).toHaveLength(0);
    expect(client.getLogs).toHaveBeenCalled();
  });

  it("fetchWhaleMovements filters by threshold", async () => {
    (client.getLogs as ReturnType<typeof vi.fn>).mockResolvedValue([
      { args: { from: WETH, to: POOL_MANAGER, value: 50000000000000000000n }, blockNumber: 9999n, transactionHash: "0xabc" },
      { args: { from: WETH, to: POOL_MANAGER, value: 200000000000000000000n }, blockNumber: 9998n, transactionHash: "0xdef" },
    ]);
    const result = await aggregator.fetchWhaleMovements([WETH]);
    expect(result).toHaveLength(1);
    expect(result[0]!.value).toBe(200000000000000000000n);
  });

  it("fetchLiquidityChanges returns parsed events", async () => {
    (client.getLogs as ReturnType<typeof vi.fn>).mockResolvedValue([
      { args: { id: POOL_ID, liquidityDelta: 1000000n }, blockNumber: 9999n, transactionHash: "0xabc" },
      { args: { id: POOL_ID, liquidityDelta: -500000n }, blockNumber: 9998n, transactionHash: "0xdef" },
    ]);
    const result = await aggregator.fetchLiquidityChanges(POOL_MANAGER);
    expect(result).toHaveLength(2);
    expect(result[0]!.type).toBe("add");
    expect(result[1]!.type).toBe("remove");
  });

  it("detectVolumeAnomalies identifies spikes", async () => {
    (client.getLogs as ReturnType<typeof vi.fn>).mockResolvedValue([
      { args: { id: POOL_ID, amount0: 500000000000000000000n } },
      { args: { id: POOL_ID, amount0: -300000000000000000000n } },
    ]);
    const historicalVolumes = new Map<string, bigint>();
    historicalVolumes.set(POOL_ID, 100000000000000000000n);
    const result = await aggregator.detectVolumeAnomalies(POOL_MANAGER, [POOL_ID], historicalVolumes);
    expect(result).toHaveLength(1);
    expect(result[0]!.ratio).toBeGreaterThanOrEqual(3);
  });

  it("detectVolumeAnomalies ignores normal volume", async () => {
    (client.getLogs as ReturnType<typeof vi.fn>).mockResolvedValue([
      { args: { id: POOL_ID, amount0: 50000000000000000000n } },
    ]);
    const historicalVolumes = new Map<string, bigint>();
    historicalVolumes.set(POOL_ID, 100000000000000000000n);
    const result = await aggregator.detectVolumeAnomalies(POOL_MANAGER, [POOL_ID], historicalVolumes);
    expect(result).toHaveLength(0);
  });

  it("detectPriceDeviations finds cross-pool arbitrage", async () => {
    const getPrices = vi.fn()
      .mockResolvedValueOnce(1000000n)
      .mockResolvedValueOnce(1100000n);
    const poolId2 = "0x3333333333333333333333333333333333333333333333333333333333333334" as `0x${string}`;
    const result = await aggregator.detectPriceDeviations([POOL_ID, poolId2], getPrices);
    expect(result).toHaveLength(1);
    expect(result[0]!.maxDeviationBps).toBeGreaterThan(0);
  });

  it("aggregate combines all data sources", async () => {
    const result = await aggregator.aggregate({
      tokens: [WETH],
      poolManagerAddress: POOL_MANAGER,
      poolIds: [POOL_ID],
      historicalVolumes: new Map(),
      getPrices: vi.fn().mockResolvedValue(1000000n),
    });
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.whaleMovements).toEqual([]);
    expect(result.liquidityChanges).toEqual([]);
    expect(result.volumeAnomalies).toEqual([]);
  });
});
