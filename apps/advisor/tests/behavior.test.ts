import { describe, it, expect, beforeEach } from "vitest";
import { createBehaviorMonitor, type BehaviorMonitor } from "../src/behavior/index.js";
import type { BehaviorConfig } from "../src/types.js";

const config: BehaviorConfig = {
  enabled: true,
  frequencyMultiplier: 3.0,
  maxSingleTradePercent: 40,
  maxConcentrationPercent: 70,
  maxDailyLossPercent: 15,
  lookbackDays: 30,
};

describe("BehaviorMonitor", () => {
  let monitor: BehaviorMonitor;

  beforeEach(() => {
    monitor = createBehaviorMonitor(config);
  });

  it("returns normal status with no trades", () => {
    const status = monitor.getStatus();
    expect(status.level).toBe("normal");
    expect(status.alerts).toHaveLength(0);
  });

  it("detects oversized trade", () => {
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 50, asset: "ETH", pnlPercent: 0 });
    const status = monitor.getStatus();
    expect(status.level).toBe("warning");
    expect(status.alerts.some((a) => a.metric === "single_trade_size")).toBe(true);
  });

  it("detects critical oversized trade", () => {
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 70, asset: "ETH", pnlPercent: 0 });
    const status = monitor.getStatus();
    expect(status.level).toBe("critical");
  });

  it("detects consecutive same-direction trades", () => {
    for (let i = 0; i < 5; i++) {
      monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 5, asset: "ETH", pnlPercent: 1 });
    }
    const status = monitor.getStatus();
    expect(status.alerts.some((a) => a.metric === "consecutive_direction")).toBe(true);
  });

  it("does not alert on mixed direction trades", () => {
    const dirs: ("buy" | "sell")[] = ["buy", "sell", "buy", "sell", "buy"];
    for (const d of dirs) {
      monitor.recordTrade({ timestamp: Date.now(), direction: d, sizePercent: 5, asset: "ETH", pnlPercent: 0 });
    }
    const status = monitor.getStatus();
    expect(status.alerts.some((a) => a.metric === "consecutive_direction")).toBe(false);
  });

  it("detects high concentration in single asset", () => {
    for (let i = 0; i < 8; i++) {
      monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 5, asset: "ETH", pnlPercent: 0 });
    }
    monitor.recordTrade({ timestamp: Date.now(), direction: "sell", sizePercent: 5, asset: "BTC", pnlPercent: 0 });
    const status = monitor.getStatus();
    expect(status.alerts.some((a) => a.metric === "position_concentration")).toBe(true);
  });

  it("detects daily loss exceeding threshold", () => {
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: -8 });
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: -10 });
    const status = monitor.getStatus();
    expect(status.alerts.some((a) => a.metric === "daily_loss")).toBe(true);
    expect(status.level).toBe("warning");
  });

  it("detects critical daily loss", () => {
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: -12 });
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: -15 });
    const status = monitor.getStatus();
    const lossAlert = status.alerts.find((a) => a.metric === "daily_loss");
    expect(lossAlert?.level).toBe("critical");
  });

  it("getTradeCount returns count within window", () => {
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 5, asset: "ETH", pnlPercent: 0 });
    monitor.recordTrade({ timestamp: Date.now() - 100000000, direction: "buy", sizePercent: 5, asset: "ETH", pnlPercent: 0 });
    expect(monitor.getTradeCount(60000)).toBe(1);
    expect(monitor.getTradeCount(200000000)).toBe(2);
  });

  it("reset clears all trades", () => {
    monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 50, asset: "ETH", pnlPercent: 0 });
    expect(monitor.getStatus().level).toBe("warning");
    monitor.reset();
    expect(monitor.getStatus().level).toBe("normal");
  });

  it("detects high frequency with no baseline", () => {
    for (let i = 0; i < 6; i++) {
      monitor.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 5, asset: `TOKEN${i}`, pnlPercent: 0 });
    }
    const status = monitor.getStatus();
    expect(status.alerts.some((a) => a.metric === "trade_frequency")).toBe(true);
  });
});
