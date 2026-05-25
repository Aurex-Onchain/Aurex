import { describe, it, expect } from "vitest";
import {
  computeVolatility,
  computeAlpha,
  computeRisk,
  computeLiquidity,
  computeRecommendedFee,
  computeScores,
} from "../src/signal/index.js";
import type { PriceSnapshot, ScoreInput } from "../src/signal/index.js";

const BASE_PRICE = 79228162514264337593543950336n; // 1:1 sqrtPriceX96

function makeHistory(deltas: number[], intervalMs = 60000): PriceSnapshot[] {
  const now = Date.now();
  return deltas.map((d, i) => ({
    sqrtPriceX96: BASE_PRICE + BigInt(Math.round(d * Number(BASE_PRICE) / 10000)),
    timestamp: now - (deltas.length - 1 - i) * intervalMs,
  }));
}

describe("computeVolatility", () => {
  it("returns 50 for insufficient data", () => {
    expect(computeVolatility([])).toBe(50n);
    expect(computeVolatility([{ sqrtPriceX96: BASE_PRICE, timestamp: 0 }])).toBe(50n);
  });

  it("returns 0 for stable prices", () => {
    const history = makeHistory([0, 0, 0, 0, 0]);
    expect(computeVolatility(history)).toBe(0n);
  });

  it("returns higher score for volatile prices", () => {
    const stable = makeHistory([0, 1, 0, 1, 0]);
    const volatile = makeHistory([0, 50, -50, 80, -30]);
    expect(computeVolatility(volatile)).toBeGreaterThan(computeVolatility(stable));
  });

  it("clamps to 100 max", () => {
    const extreme = makeHistory([0, 500, -500, 1000, -1000]);
    expect(computeVolatility(extreme)).toBeLessThanOrEqual(100n);
  });
});

describe("computeAlpha", () => {
  it("returns 50 for insufficient data", () => {
    expect(computeAlpha([])).toBe(50n);
  });

  it("returns >50 for upward trend", () => {
    const history = makeHistory([0, 10, 20, 30, 40]);
    expect(computeAlpha(history)).toBeGreaterThan(50n);
  });

  it("returns <50 for downward trend", () => {
    const history = makeHistory([0, -10, -20, -30, -40]);
    expect(computeAlpha(history)).toBeLessThan(50n);
  });

  it("returns 50 for flat prices", () => {
    const history = makeHistory([0, 0, 0, 0, 0]);
    expect(computeAlpha(history)).toBe(50n);
  });

  it("clamps between 0 and 100", () => {
    const extreme = makeHistory([0, 0, 0, 0, 2000]);
    const score = computeAlpha(extreme);
    expect(score).toBeGreaterThanOrEqual(0n);
    expect(score).toBeLessThanOrEqual(100n);
  });
});

describe("computeRisk", () => {
  it("low volatility + neutral alpha = low risk", () => {
    expect(computeRisk(10n, 50n)).toBe(6n);
  });

  it("high volatility = high risk", () => {
    expect(computeRisk(90n, 50n)).toBe(54n);
  });

  it("extreme alpha deviation increases risk", () => {
    const neutralAlpha = computeRisk(50n, 50n);
    const extremeAlpha = computeRisk(50n, 90n);
    expect(extremeAlpha).toBeGreaterThan(neutralAlpha);
  });

  it("clamps to 100", () => {
    expect(computeRisk(100n, 100n)).toBeLessThanOrEqual(100n);
  });
});

describe("computeLiquidity", () => {
  it("returns 50 for insufficient data", () => {
    expect(computeLiquidity([])).toBe(50n);
  });

  it("tight spread = high liquidity score", () => {
    const tight = makeHistory([0, 1, -1, 1, 0]);
    expect(computeLiquidity(tight)).toBeGreaterThan(80n);
  });

  it("wide spread = low liquidity score", () => {
    const wide = makeHistory([0, 500, -500, 300, -200]);
    expect(computeLiquidity(wide)).toBeLessThan(computeLiquidity(makeHistory([0, 1, -1, 1, 0])));
  });
});

describe("computeRecommendedFee", () => {
  it("returns defaultFee when risk is 0", () => {
    expect(computeRecommendedFee(0n, 3000, 10000)).toBe(3000);
  });

  it("returns maxFee when risk is 100", () => {
    expect(computeRecommendedFee(100n, 3000, 10000)).toBe(10000);
  });

  it("scales linearly between default and max", () => {
    const fee = computeRecommendedFee(50n, 3000, 10000);
    expect(fee).toBe(6500);
  });
});

describe("computeScores", () => {
  it("produces complete score output from pool metrics", () => {
    const input: ScoreInput = {
      pool: {
        poolId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        currentPrice: BASE_PRICE,
        priceHistory: makeHistory([0, 5, 10, 8, 15, 12, 20]),
        token0: "0x0000000000000000000000000000000000000001",
        token1: "0x0000000000000000000000000000000000000002",
      },
      defaultFee: 3000,
      maxFee: 10000,
    };

    const result = computeScores(input);

    expect(result.riskScore).toBeGreaterThanOrEqual(0n);
    expect(result.riskScore).toBeLessThanOrEqual(100n);
    expect(result.alphaScore).toBeGreaterThanOrEqual(0n);
    expect(result.alphaScore).toBeLessThanOrEqual(100n);
    expect(result.liquidityScore).toBeGreaterThanOrEqual(0n);
    expect(result.liquidityScore).toBeLessThanOrEqual(100n);
    expect(result.volatilityScore).toBeGreaterThanOrEqual(0n);
    expect(result.volatilityScore).toBeLessThanOrEqual(100n);
    expect(result.recommendedFee).toBeGreaterThanOrEqual(3000);
    expect(result.recommendedFee).toBeLessThanOrEqual(10000);
  });

  it("uptrend produces alpha > 50", () => {
    const input: ScoreInput = {
      pool: {
        poolId: "0x2222222222222222222222222222222222222222222222222222222222222222",
        currentPrice: BASE_PRICE + BASE_PRICE / 100n,
        priceHistory: makeHistory([0, 10, 20, 30, 40, 50]),
        token0: "0x0000000000000000000000000000000000000001",
        token1: "0x0000000000000000000000000000000000000002",
      },
      defaultFee: 3000,
      maxFee: 10000,
    };

    const result = computeScores(input);
    expect(result.alphaScore).toBeGreaterThan(50n);
  });
});
