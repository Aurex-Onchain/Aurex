import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSignalLoop, type TickResult } from "../src/signal/loop.js";
import type { ChainReader } from "../src/chain/reader.js";
import type { ChainWriter } from "../src/chain/writer.js";
import type { PriceStore } from "../src/signal/store.js";

const POOL_ID = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;
const TX_HASH = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`;
const PUBLISHER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`;

function createMockReader(): ChainReader {
  return {
    getLatestSignal: vi.fn(),
    getSignalsByPool: vi.fn(),
    isSignalValid: vi.fn(),
    getSignalCount: vi.fn(),
    getPublisherInfo: vi.fn(),
    getPublisherCount: vi.fn(),
    getPublisherList: vi.fn(),
    getPoolPolicy: vi.fn().mockResolvedValue({
      maxRiskScore: 80n,
      minLiquidityScore: 20n,
      defaultFee: 3000,
      maxFee: 10000,
      publisherShareBps: 500,
      blockHighRiskTrades: false,
      allowSwapWhenSignalExpired: true,
      policyAdmin: PUBLISHER,
    }),
    hasPolicy: vi.fn(),
    getSlot0Price: vi.fn().mockResolvedValue(79228162514264337593543950336n),
    getClaimable: vi.fn(),
    getTokenBalance: vi.fn(),
    getTokenSymbol: vi.fn(),
  };
}

function createMockWriter(): ChainWriter {
  return {
    getAddress: vi.fn().mockReturnValue(PUBLISHER),
    registerPublisher: vi.fn(),
    increaseStake: vi.fn(),
    unregisterPublisher: vi.fn(),
    publishSignal: vi.fn().mockResolvedValue(TX_HASH),
    verifySignal: vi.fn(),
    claimFees: vi.fn(),
    approveToken: vi.fn(),
  };
}

function createMockStore(history: { sqrtPriceX96: bigint; timestamp: number }[] = []): PriceStore {
  const data: Map<string, { sqrtPriceX96: bigint; timestamp: number }[]> = new Map();
  if (history.length > 0) {
    data.set(POOL_ID, [...history]);
  }
  return {
    save: vi.fn((poolId: string, snapshot) => {
      if (!data.has(poolId)) data.set(poolId, []);
      data.get(poolId)!.push(snapshot);
    }),
    getHistory: vi.fn((poolId: string, limit: number) => {
      const all = data.get(poolId) || [];
      return all.slice(-limit);
    }),
    getLatest: vi.fn((poolId: string) => {
      const all = data.get(poolId) || [];
      return all.length > 0 ? all[all.length - 1]! : null;
    }),
    prune: vi.fn(),
    close: vi.fn(),
  };
}

const BASE_PRICE = 79228162514264337593543950336n;

describe("SignalLoop", () => {
  let reader: ChainReader;
  let writer: ChainWriter;
  let store: PriceStore;

  beforeEach(() => {
    reader = createMockReader();
    writer = createMockWriter();
  });

  describe("tick", () => {
    it("publishes on first tick (no previous scores)", async () => {
      const history = Array.from({ length: 5 }, (_, i) => ({
        sqrtPriceX96: BASE_PRICE + BigInt(i * 100),
        timestamp: Date.now() - (5 - i) * 60000,
      }));
      store = createMockStore(history);

      const loop = createSignalLoop(reader, writer, store, {
        poolIds: [POOL_ID],
        intervalMs: 300000,
        scoreChangeThreshold: 10,
        signalDurationMs: 3600000,
        historyDepth: 20,
        pruneOlderThanMs: 86400000,
      });

      const results = await loop.tick();
      expect(results).toHaveLength(1);
      expect(results[0]!.published).toBe(true);
      expect(results[0]!.txHash).toBe(TX_HASH);
      expect(writer.publishSignal).toHaveBeenCalledTimes(1);
    });

    it("skips publish when score change is below threshold", async () => {
      const history = Array.from({ length: 5 }, (_, i) => ({
        sqrtPriceX96: BASE_PRICE + BigInt(i),
        timestamp: Date.now() - (5 - i) * 60000,
      }));
      store = createMockStore(history);

      const loop = createSignalLoop(reader, writer, store, {
        poolIds: [POOL_ID],
        intervalMs: 300000,
        scoreChangeThreshold: 10,
        signalDurationMs: 3600000,
        historyDepth: 20,
        pruneOlderThanMs: 86400000,
      });

      await loop.tick();
      const results = await loop.tick();
      expect(results[0]!.published).toBe(false);
      expect(results[0]!.reason).toBe("below threshold");
    });

    it("handles pool with no policy gracefully", async () => {
      (reader.getPoolPolicy as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("not found"));
      store = createMockStore([]);

      const loop = createSignalLoop(reader, writer, store, {
        poolIds: [POOL_ID],
        intervalMs: 300000,
        scoreChangeThreshold: 10,
        signalDurationMs: 3600000,
        historyDepth: 20,
        pruneOlderThanMs: 86400000,
      });

      const results = await loop.tick();
      expect(results[0]!.published).toBe(false);
      expect(results[0]!.reason).toBe("no policy found");
    });

    it("saves current price to store on each tick", async () => {
      store = createMockStore([]);

      const loop = createSignalLoop(reader, writer, store, {
        poolIds: [POOL_ID],
        intervalMs: 300000,
        scoreChangeThreshold: 10,
        signalDurationMs: 3600000,
        historyDepth: 20,
        pruneOlderThanMs: 86400000,
      });

      await loop.tick();
      expect(store.save).toHaveBeenCalledWith(POOL_ID, expect.objectContaining({
        sqrtPriceX96: BASE_PRICE,
      }));
    });

    it("prunes old data on each tick", async () => {
      store = createMockStore([]);

      const loop = createSignalLoop(reader, writer, store, {
        poolIds: [POOL_ID],
        intervalMs: 300000,
        scoreChangeThreshold: 10,
        signalDurationMs: 3600000,
        historyDepth: 20,
        pruneOlderThanMs: 86400000,
      });

      await loop.tick();
      expect(store.prune).toHaveBeenCalledWith(86400000);
    });
  });

  describe("start/stop", () => {
    it("starts and stops the interval", () => {
      vi.useFakeTimers();
      store = createMockStore([]);

      const loop = createSignalLoop(reader, writer, store, {
        poolIds: [POOL_ID],
        intervalMs: 1000,
        scoreChangeThreshold: 10,
        signalDurationMs: 3600000,
        historyDepth: 20,
        pruneOlderThanMs: 86400000,
      });

      expect(loop.isRunning()).toBe(false);
      loop.start();
      expect(loop.isRunning()).toBe(true);
      loop.stop();
      expect(loop.isRunning()).toBe(false);

      vi.useRealTimers();
    });

    it("start is idempotent", () => {
      vi.useFakeTimers();
      store = createMockStore([]);

      const loop = createSignalLoop(reader, writer, store, {
        poolIds: [POOL_ID],
        intervalMs: 1000,
        scoreChangeThreshold: 10,
        signalDurationMs: 3600000,
        historyDepth: 20,
        pruneOlderThanMs: 86400000,
      });

      loop.start();
      loop.start();
      expect(loop.isRunning()).toBe(true);
      loop.stop();
      expect(loop.isRunning()).toBe(false);

      vi.useRealTimers();
    });
  });
});
