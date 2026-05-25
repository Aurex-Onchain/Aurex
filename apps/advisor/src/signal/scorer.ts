import type { PriceSnapshot, ScoreInput, ScoreOutput } from "./types.js";

const SCORE_MAX = 100n;
const SCORE_MIN = 0n;

function clamp(value: bigint): bigint {
  if (value > SCORE_MAX) return SCORE_MAX;
  if (value < SCORE_MIN) return SCORE_MIN;
  return value;
}

export function computeVolatility(history: PriceSnapshot[]): bigint {
  if (history.length < 2) return 50n;

  const prices = history.map((s) => s.sqrtPriceX96);
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]!;
    const curr = prices[i]!;
    if (prev === 0n) continue;
    const ret = Number((curr - prev) * 10000n / prev) / 10000;
    returns.push(ret);
  }

  if (returns.length === 0) return 50n;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  const normalized = Math.min(stdDev * 1000, 100);
  return BigInt(Math.round(normalized));
}

export function computeAlpha(history: PriceSnapshot[]): bigint {
  if (history.length < 2) return 50n;

  const first = history[0]!;
  const last = history[history.length - 1]!;

  if (first.sqrtPriceX96 === 0n) return 50n;

  const priceDelta = Number((last.sqrtPriceX96 - first.sqrtPriceX96) * 10000n / first.sqrtPriceX96) / 100;
  const momentum = Math.abs(priceDelta);
  const direction = priceDelta > 0 ? 1 : -1;

  const base = 50 + direction * Math.min(momentum * 5, 50);
  return clamp(BigInt(Math.round(base)));
}

export function computeRisk(volatilityScore: bigint, alphaScore: bigint): bigint {
  const volWeight = 60n;
  const alphaWeight = 40n;

  const alphaDeviation = alphaScore > 50n ? alphaScore - 50n : 50n - alphaScore;

  const risk = (volatilityScore * volWeight + alphaDeviation * alphaWeight) / 100n;
  return clamp(risk);
}

export function computeLiquidity(history: PriceSnapshot[]): bigint {
  if (history.length < 2) return 50n;

  const prices = history.map((s) => s.sqrtPriceX96);
  const max = prices.reduce((a, b) => (a > b ? a : b));
  const min = prices.reduce((a, b) => (a < b ? a : b));

  if (max === 0n) return 50n;

  const spread = Number((max - min) * 10000n / max) / 10000;
  const tightness = Math.max(0, 1 - spread * 10);
  return clamp(BigInt(Math.round(tightness * 100)));
}

export function computeRecommendedFee(
  riskScore: bigint,
  defaultFee: number,
  maxFee: number,
): number {
  const fee = defaultFee + Math.round(
    (maxFee - defaultFee) * Number(riskScore) / 100,
  );
  return Math.min(fee, maxFee);
}

export function computeScores(input: ScoreInput): ScoreOutput {
  const { pool, defaultFee, maxFee } = input;

  const volatilityScore = computeVolatility(pool.priceHistory);
  const alphaScore = computeAlpha(pool.priceHistory);
  const riskScore = computeRisk(volatilityScore, alphaScore);
  const liquidityScore = computeLiquidity(pool.priceHistory);
  const recommendedFee = computeRecommendedFee(riskScore, defaultFee, maxFee);

  return { riskScore, alphaScore, liquidityScore, volatilityScore, recommendedFee };
}
