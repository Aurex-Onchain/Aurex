import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createBehaviorStore, type BehaviorStore } from "../src/behavior/store.js";
import { createBehaviorMonitor, type BehaviorMonitor } from "../src/behavior/monitor.js";
import type { BehaviorConfig } from "../src/types.js";
import Database from "better-sqlite3";

const config: BehaviorConfig = {
  enabled: true,
  frequencyMultiplier: 3.0,
  maxSingleTradePercent: 40,
  maxConcentrationPercent: 70,
  maxDailyLossPercent: 15,
  lookbackDays: 30,
};

describe("BehaviorStore", () => {
  let store: BehaviorStore;

  beforeEach(() => {
    store = createBehaviorStore(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  it("saves and retrieves trades", () => {
    store.saveTrade({ timestamp: Date.now() - 1000, direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: 2 });
    store.saveTrade({ timestamp: Date.now(), direction: "sell", sizePercent: 5, asset: "BTC", pnlPercent: -1 });
    const trades = store.getAllTrades();
    expect(trades).toHaveLength(2);
    expect(trades[0]!.direction).toBe("sell");
  });

  it("filters trades by time window", () => {
    store.saveTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: 0 });
    store.saveTrade({ timestamp: Date.now() - 200000, direction: "sell", sizePercent: 5, asset: "BTC", pnlPercent: 0 });
    const recent = store.getTrades(100000);
    expect(recent).toHaveLength(1);
    expect(recent[0]!.asset).toBe("ETH");
  });

  it("prunes old trades", () => {
    store.saveTrade({ timestamp: Date.now() - 100000, direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: 0 });
    store.saveTrade({ timestamp: Date.now(), direction: "sell", sizePercent: 5, asset: "BTC", pnlPercent: 0 });
    store.prune(50000);
    const all = store.getAllTrades();
    expect(all).toHaveLength(1);
    expect(all[0]!.asset).toBe("BTC");
  });
});

describe("BehaviorMonitor with persistent store", () => {
  let store: BehaviorStore;
  let monitor: BehaviorMonitor;

  beforeEach(() => {
    store = createBehaviorStore(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  it("loads historical trades from store on creation", () => {
    store.saveTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 50, asset: "ETH", pnlPercent: 0 });
    monitor = createBehaviorMonitor(config, store);
    const status = monitor.getStatus();
    expect(status.level).toBe("warning");
  });

  it("persists new trades to store", () => {
    monitor = createBehaviorMonitor(config, store);
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: 0 });
    const trades = store.getAllTrades();
    expect(trades).toHaveLength(1);
  });

  it("survives monitor recreation with same store", () => {
    monitor = createBehaviorMonitor(config, store);
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 50, asset: "ETH", pnlPercent: 0 });

    const monitor2 = createBehaviorMonitor(config, store);
    const status = monitor2.getStatus();
    expect(status.level).toBe("warning");
  });
});
