import type { ChainReader } from "../chain/index.js";
import type { MessageStore } from "../messages/store.js";
import { createLogger } from "../logger.js";

const logger = createLogger();

export interface ExpiryWatcherConfig {
  poolIds: `0x${string}`[];
  intervalMs: number;
}

export interface ExpiryWatcher {
  start(): void;
  stop(): void;
  tick(): Promise<void>;
  isRunning(): boolean;
}

export function createExpiryWatcher(
  reader: ChainReader,
  messageStore: MessageStore,
  config: ExpiryWatcherConfig,
): ExpiryWatcher {
  let timer: ReturnType<typeof setInterval> | null = null;
  const reportedExpired = new Set<string>();

  async function tick() {
    const now = Math.floor(Date.now() / 1000);

    for (const poolId of config.poolIds) {
      try {
        const signal = await reader.getLatestSignal(poolId);
        if (!signal) continue;

        const signalKey = signal.signalId;
        if (reportedExpired.has(signalKey)) continue;

        const expiresAt = Number(signal.expiresAt);
        if (expiresAt > 0 && expiresAt <= now) {
          reportedExpired.add(signalKey);
          const content = `Signal ${signalKey.slice(0, 10)}... for pool ${poolId.slice(0, 10)}... has expired`;
          messageStore.save({
            type: "signal_expired",
            role: "assistant",
            content,
            metadata: { poolId, signalId: signalKey, expiresAt },
          });
          logger.info({ poolId, signalId: signalKey }, "Signal expired");
        }
      } catch {}
    }
  }

  return {
    start() {
      if (timer) return;
      tick();
      timer = setInterval(tick, config.intervalMs);
      logger.info(`Expiry watcher started (interval: ${config.intervalMs}ms, pools: ${config.poolIds.length})`);
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
