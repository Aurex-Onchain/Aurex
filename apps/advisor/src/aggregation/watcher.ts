import type { Address } from "viem";
import type { OnchainAggregator } from "./index.js";
import type { ChainReader } from "../chain/index.js";
import type { AlertContext } from "../alerts/notifier.js";
import { createLogger } from "../logger.js";

const logger = createLogger();

export interface AggregationWatcherConfig {
  tokens: Address[];
  poolManagerAddress: Address;
  poolIds: `0x${string}`[];
  intervalMs: number;
  onAlert: (alert: AlertContext) => void | Promise<void>;
}

export interface AggregationWatcher {
  start(): void;
  stop(): void;
  tick(): Promise<void>;
  isRunning(): boolean;
}

export function createAggregationWatcher(
  aggregator: OnchainAggregator,
  _reader: ChainReader,
  config: AggregationWatcherConfig,
): AggregationWatcher {
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastSeenBlock = 0n;
  const historicalVolumes = new Map<string, bigint>();

  async function tick() {
    try {
      const movements = await aggregator.fetchWhaleMovements(config.tokens);
      for (const m of movements) {
        if (m.blockNumber <= lastSeenBlock) continue;
        const ethValue = Number(m.value / 10n ** 18n);
        config.onAlert({
          type: "whale_movement",
          summary: `Whale transfer: ${ethValue.toLocaleString()} tokens from ${m.from.slice(0, 8)}… to ${m.to.slice(0, 8)}…`,
          data: {
            from: m.from,
            to: m.to,
            value: m.value.toString(),
            token: m.token,
            txHash: m.txHash,
            blockNumber: m.blockNumber.toString(),
          },
        });
      }

      if (config.poolIds.length > 0) {
        const anomalies = await aggregator.detectVolumeAnomalies(
          config.poolManagerAddress,
          config.poolIds,
          historicalVolumes,
        );
        for (const a of anomalies) {
          config.onAlert({
            type: "whale_movement",
            summary: `Volume spike in pool ${a.poolId.slice(0, 10)}…: ${a.ratio.toFixed(1)}x normal`,
            data: {
              poolId: a.poolId,
              currentVolume: a.currentVolume.toString(),
              averageVolume: a.averageVolume.toString(),
              ratio: a.ratio,
            },
          });
          historicalVolumes.set(a.poolId, a.currentVolume);
        }
      }

      if (movements.length > 0) {
        lastSeenBlock = movements[0]!.blockNumber;
      }
    } catch (err) {
      logger.warn({ err }, "Aggregation watcher tick failed");
    }
  }

  return {
    start() {
      if (timer) return;
      tick();
      timer = setInterval(tick, config.intervalMs);
      logger.info(`Aggregation watcher started (interval: ${config.intervalMs}ms, tokens: ${config.tokens.length})`);
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    tick,
    isRunning() {
      return timer !== null;
    },
  };
}
