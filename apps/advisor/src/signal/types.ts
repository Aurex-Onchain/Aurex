import type { Address } from "viem";

export interface PriceSnapshot {
  sqrtPriceX96: bigint;
  timestamp: number;
}

export interface PoolMetrics {
  poolId: `0x${string}`;
  currentPrice: bigint;
  priceHistory: PriceSnapshot[];
  token0: Address;
  token1: Address;
}

export interface ScoreInput {
  pool: PoolMetrics;
  defaultFee: number;
  maxFee: number;
}

export interface ScoreOutput {
  riskScore: bigint;
  alphaScore: bigint;
  liquidityScore: bigint;
  volatilityScore: bigint;
  recommendedFee: number;
}
