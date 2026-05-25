import { keccak256, encodePacked } from "viem";
import type { ChainReader } from "../chain/reader.js";
import type { ChainWriter } from "../chain/writer.js";
import type { AurexSignal } from "../types.js";
import type { AlertContext } from "../alerts/notifier.js";
import type { PriceStore } from "./store.js";
import type { ScoreOutput } from "./types.js";
import { computeScores } from "./scorer.js";

export interface LoopConfig {
  poolIds: `0x${string}`[];
  intervalMs: number;
  scoreChangeThreshold: number;
  signalDurationMs: number;
  historyDepth: number;
  pruneOlderThanMs: number;
  onAlert?: (alert: AlertContext) => void | Promise<void>;
}

export interface SignalLoop {
  start(): void;
  stop(): void;
  tick(): Promise<TickResult[]>;
  isRunning(): boolean;
}

export interface TickResult {
  poolId: `0x${string}`;
  scores: ScoreOutput;
  published: boolean;
  txHash?: `0x${string}`;
  reason: string;
}

interface LastPublished {
  riskScore: bigint;
  alphaScore: bigint;
  liquidityScore: bigint;
  volatilityScore: bigint;
}

export function createSignalLoop(
  reader: ChainReader,
  writer: ChainWriter,
  store: PriceStore,
  config: LoopConfig,
): SignalLoop {
  let timer: ReturnType<typeof setInterval> | null = null;
  const lastPublished = new Map<string, LastPublished>();
  function shouldPublish(poolId: string, scores: ScoreOutput): boolean {
    const prev = lastPublished.get(poolId);
    if (!prev) return true;

    const threshold = BigInt(config.scoreChangeThreshold);
    const riskDelta = scores.riskScore > prev.riskScore
      ? scores.riskScore - prev.riskScore
      : prev.riskScore - scores.riskScore;
    const alphaDelta = scores.alphaScore > prev.alphaScore
      ? scores.alphaScore - prev.alphaScore
      : prev.alphaScore - scores.alphaScore;

    return riskDelta >= threshold || alphaDelta >= threshold;
  }

  function makeSignalId(poolId: `0x${string}`, timestamp: number): `0x${string}` {
    return keccak256(
      encodePacked(["bytes32", "address", "uint64"], [poolId, writer.getAddress(), BigInt(timestamp)]),
    );
  }

  async function processPool(poolId: `0x${string}`): Promise<TickResult> {
    const now = Date.now();

    const currentPrice = await reader.getSlot0Price(poolId);
    store.save(poolId, { sqrtPriceX96: currentPrice, timestamp: now });

    const history = store.getHistory(poolId, config.historyDepth);

    let policy;
    try {
      policy = await reader.getPoolPolicy(poolId);
    } catch {
      return { poolId, scores: emptyScores(), published: false, reason: "no policy found" };
    }

    const scores = computeScores({
      pool: {
        poolId,
        currentPrice,
        priceHistory: history,
        token0: "0x0000000000000000000000000000000000000000",
        token1: "0x0000000000000000000000000000000000000000",
      },
      defaultFee: policy.defaultFee,
      maxFee: policy.maxFee,
    });

    if (!shouldPublish(poolId, scores)) {
      return { poolId, scores, published: false, reason: "below threshold" };
    }

    const expiresAt = BigInt(Math.floor((now + config.signalDurationMs) / 1000));
    const signalId = makeSignalId(poolId, now);

    const signal: AurexSignal = {
      signalId,
      poolId,
      riskScore: scores.riskScore,
      alphaScore: scores.alphaScore,
      liquidityScore: scores.liquidityScore,
      volatilityScore: scores.volatilityScore,
      recommendedFee: scores.recommendedFee,
      expiresAt,
      signer: writer.getAddress(),
    };

    const txHash = await writer.publishSignal(signal);

    lastPublished.set(poolId, {
      riskScore: scores.riskScore,
      alphaScore: scores.alphaScore,
      liquidityScore: scores.liquidityScore,
      volatilityScore: scores.volatilityScore,
    });

    return { poolId, scores, published: true, txHash, reason: "published" };
  }

  async function tick(): Promise<TickResult[]> {
    store.prune(config.pruneOlderThanMs);
    const results = await Promise.allSettled(config.poolIds.map(processPool));
    const tickResults = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { poolId: config.poolIds[i]!, scores: emptyScores(), published: false, reason: `error: ${r.reason}` },
    );

    if (config.onAlert) {
      for (const result of tickResults) {
        if (result.published) {
          config.onAlert({
            type: "score_change",
            summary: `Signal published for pool ${result.poolId.slice(0, 10)}… — risk: ${result.scores.riskScore}, alpha: ${result.scores.alphaScore}`,
            data: {
              poolId: result.poolId,
              riskScore: result.scores.riskScore.toString(),
              alphaScore: result.scores.alphaScore.toString(),
              liquidityScore: result.scores.liquidityScore.toString(),
              volatilityScore: result.scores.volatilityScore.toString(),
              recommendedFee: result.scores.recommendedFee,
              txHash: result.txHash,
            },
          });
        }
      }
    }

    return tickResults;
  }

  return {
    start() {
      if (timer) return;
      timer = setInterval(() => { tick(); }, config.intervalMs);
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

function emptyScores(): ScoreOutput {
  return { riskScore: 0n, alphaScore: 0n, liquidityScore: 0n, volatilityScore: 0n, recommendedFee: 0 };
}
