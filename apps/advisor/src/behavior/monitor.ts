import type { BehaviorConfig, BehaviorStatus, BehaviorAlert } from "../types.js";
import type { BehaviorStore } from "./store.js";

export interface TradeRecord {
  timestamp: number;
  direction: "buy" | "sell";
  sizePercent: number;
  asset: string;
  pnlPercent: number;
}

export interface BehaviorMonitor {
  recordTrade(trade: TradeRecord): void;
  getStatus(): BehaviorStatus;
  getTradeCount(windowMs: number): number;
  reset(): void;
}

export function createBehaviorMonitor(config: BehaviorConfig, store?: BehaviorStore): BehaviorMonitor {
  const trades: TradeRecord[] = [];

  if (store) {
    const lookbackMs = config.lookbackDays * 24 * 60 * 60 * 1000;
    const persisted = store.getTrades(lookbackMs);
    trades.push(...persisted);
  }

  function getRecentTrades(windowMs: number): TradeRecord[] {
    const cutoff = Date.now() - windowMs;
    return trades.filter((t) => t.timestamp > cutoff);
  }

  function checkFrequency(): BehaviorAlert | null {
    const dayMs = 24 * 60 * 60 * 1000;
    const todayTrades = getRecentTrades(dayMs);
    const olderTrades = trades.filter((t) => t.timestamp <= Date.now() - dayMs && t.timestamp > Date.now() - config.lookbackDays * dayMs);
    const daysWithHistory = Math.max(1, config.lookbackDays - 1);
    const avgDaily = olderTrades.length / daysWithHistory;

    if (olderTrades.length === 0 && todayTrades.length > 5) {
      return {
        metric: "trade_frequency",
        current: todayTrades.length,
        threshold: 5,
        level: "warning",
        message: `${todayTrades.length} trades today with no baseline history`,
      };
    }

    if (avgDaily > 0 && todayTrades.length > avgDaily * config.frequencyMultiplier) {
      const level = todayTrades.length > avgDaily * config.frequencyMultiplier * 2 ? "critical" : "warning";
      return {
        metric: "trade_frequency",
        current: todayTrades.length,
        threshold: Math.round(avgDaily * config.frequencyMultiplier),
        level,
        message: `${todayTrades.length} trades today vs ${avgDaily.toFixed(1)} daily average (${config.frequencyMultiplier}x threshold)`,
      };
    }
    return null;
  }

  function checkTradeSize(): BehaviorAlert | null {
    const dayMs = 24 * 60 * 60 * 1000;
    const recent = getRecentTrades(dayMs);
    const large = recent.find((t) => t.sizePercent > config.maxSingleTradePercent);
    if (large) {
      const level = large.sizePercent > config.maxSingleTradePercent * 1.5 ? "critical" : "warning";
      return {
        metric: "single_trade_size",
        current: large.sizePercent,
        threshold: config.maxSingleTradePercent,
        level,
        message: `Trade size ${large.sizePercent}% exceeds ${config.maxSingleTradePercent}% max`,
      };
    }
    return null;
  }
  function checkConcentration(): BehaviorAlert | null {
    const dayMs = 24 * 60 * 60 * 1000;
    const recent = getRecentTrades(dayMs);
    if (recent.length < 3) return null;

    const assetCounts = new Map<string, number>();
    for (const t of recent) {
      assetCounts.set(t.asset, (assetCounts.get(t.asset) || 0) + 1);
    }
    const maxAsset = [...assetCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!maxAsset) return null;

    const concentration = (maxAsset[1] / recent.length) * 100;
    if (concentration > config.maxConcentrationPercent) {
      return {
        metric: "position_concentration",
        current: Math.round(concentration),
        threshold: config.maxConcentrationPercent,
        level: "warning",
        message: `${Math.round(concentration)}% of trades in ${maxAsset[0]} (threshold: ${config.maxConcentrationPercent}%)`,
      };
    }
    return null;
  }

  function checkConsecutiveDirection(): BehaviorAlert | null {
    if (trades.length < 5) return null;
    const last5 = trades.slice(-5);
    const allSame = last5.every((t) => t.direction === last5[0]!.direction);
    if (allSame) {
      return {
        metric: "consecutive_direction",
        current: 5,
        threshold: 5,
        level: "info",
        message: `5 consecutive ${last5[0]!.direction} trades`,
      };
    }
    return null;
  }

  function checkDailyLoss(): BehaviorAlert | null {
    const dayMs = 24 * 60 * 60 * 1000;
    const recent = getRecentTrades(dayMs);
    if (recent.length === 0) return null;

    const totalLoss = recent.reduce((sum, t) => sum + Math.min(0, t.pnlPercent), 0);
    const absLoss = Math.abs(totalLoss);

    if (absLoss > config.maxDailyLossPercent) {
      const level = absLoss > config.maxDailyLossPercent * 1.5 ? "critical" : "warning";
      return {
        metric: "daily_loss",
        current: Math.round(absLoss),
        threshold: config.maxDailyLossPercent,
        level,
        message: `Daily cumulative loss ${absLoss.toFixed(1)}% exceeds ${config.maxDailyLossPercent}% threshold`,
      };
    }
    return null;
  }

  function computeLevel(alerts: BehaviorAlert[]): BehaviorStatus["level"] {
    if (alerts.some((a) => a.level === "critical")) return "critical";
    if (alerts.some((a) => a.level === "warning")) return "warning";
    if (alerts.some((a) => a.level === "info")) return "info";
    return "normal";
  }

  return {
    recordTrade(trade) {
      trades.push(trade);
      if (store) store.saveTrade(trade);
    },

    getStatus() {
      const alerts: BehaviorAlert[] = [];
      const freq = checkFrequency();
      if (freq) alerts.push(freq);
      const size = checkTradeSize();
      if (size) alerts.push(size);
      const conc = checkConcentration();
      if (conc) alerts.push(conc);
      const dir = checkConsecutiveDirection();
      if (dir) alerts.push(dir);
      const loss = checkDailyLoss();
      if (loss) alerts.push(loss);

      return { level: computeLevel(alerts), alerts };
    },

    getTradeCount(windowMs) {
      return getRecentTrades(windowMs).length;
    },

    reset() {
      trades.length = 0;
    },
  };
}
