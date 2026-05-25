import { describe, it, expect, afterEach } from "vitest";
import { createPriceStore } from "../src/signal/store.js";
import type { PriceStore } from "../src/signal/store.js";

describe("PriceStore", () => {
  let store: PriceStore;

  afterEach(() => {
    store?.close();
  });

  it("saves and retrieves price snapshots", () => {
    store = createPriceStore(":memory:");
    const poolId = "0x1111";
    store.save(poolId, { sqrtPriceX96: 1000n, timestamp: 100 });
    store.save(poolId, { sqrtPriceX96: 2000n, timestamp: 200 });

    const history = store.getHistory(poolId, 10);
    expect(history).toHaveLength(2);
    expect(history[0]!.sqrtPriceX96).toBe(1000n);
    expect(history[1]!.sqrtPriceX96).toBe(2000n);
  });

  it("returns history in chronological order", () => {
    store = createPriceStore(":memory:");
    const poolId = "0xaaaa";
    store.save(poolId, { sqrtPriceX96: 100n, timestamp: 300 });
    store.save(poolId, { sqrtPriceX96: 200n, timestamp: 100 });
    store.save(poolId, { sqrtPriceX96: 300n, timestamp: 200 });

    const history = store.getHistory(poolId, 10);
    expect(history[0]!.timestamp).toBe(100);
    expect(history[1]!.timestamp).toBe(200);
    expect(history[2]!.timestamp).toBe(300);
  });

  it("respects limit parameter", () => {
    store = createPriceStore(":memory:");
    const poolId = "0x2222";
    for (let i = 0; i < 20; i++) {
      store.save(poolId, { sqrtPriceX96: BigInt(i * 100), timestamp: i * 1000 });
    }

    const history = store.getHistory(poolId, 5);
    expect(history).toHaveLength(5);
    expect(history[0]!.sqrtPriceX96).toBe(1500n);
  });

  it("getLatest returns most recent snapshot", () => {
    store = createPriceStore(":memory:");
    const poolId = "0x3333";
    store.save(poolId, { sqrtPriceX96: 100n, timestamp: 1000 });
    store.save(poolId, { sqrtPriceX96: 999n, timestamp: 5000 });

    const latest = store.getLatest(poolId);
    expect(latest).not.toBeNull();
    expect(latest!.sqrtPriceX96).toBe(999n);
  });

  it("getLatest returns null for unknown pool", () => {
    store = createPriceStore(":memory:");
    expect(store.getLatest("0xunknown")).toBeNull();
  });

  it("prune removes old entries", () => {
    store = createPriceStore(":memory:");
    const poolId = "0x4444";
    const now = Date.now();
    store.save(poolId, { sqrtPriceX96: 100n, timestamp: now - 100000 });
    store.save(poolId, { sqrtPriceX96: 200n, timestamp: now });

    store.prune(50000);

    const history = store.getHistory(poolId, 10);
    expect(history).toHaveLength(1);
    expect(history[0]!.sqrtPriceX96).toBe(200n);
  });

  it("isolates pools from each other", () => {
    store = createPriceStore(":memory:");
    store.save("pool_a", { sqrtPriceX96: 111n, timestamp: 1 });
    store.save("pool_b", { sqrtPriceX96: 222n, timestamp: 1 });

    expect(store.getHistory("pool_a", 10)).toHaveLength(1);
    expect(store.getHistory("pool_b", 10)).toHaveLength(1);
    expect(store.getHistory("pool_a", 10)[0]!.sqrtPriceX96).toBe(111n);
  });
});
