import { describe, it, expect } from "vitest";
import { simulateActions, type PortfolioPosition, type SimulationInput } from "../src/strategy/index.js";
import type { SwapAction, HedgeAction, AddLiquidityAction, WaitAction, AlertAction } from "../src/strategy/actions.js";
import type { PoolPolicy } from "../src/types.js";

const WETH = "0x1111111111111111111111111111111111111111" as `0x${string}`;
const USDC = "0x2222222222222222222222222222222222222222" as `0x${string}`;
const POOL_ID = "0x3333333333333333333333333333333333333333333333333333333333333333" as `0x${string}`;

function makePortfolio(): PortfolioPosition[] {
  return [
    { token: WETH, symbol: "WETH", balance: 10000000000000000000n, valueUsd: 20000 },
    { token: USDC, symbol: "USDC", balance: 5000000000n, valueUsd: 5000 },
  ];
}

function makePolicy(): PoolPolicy {
  return {
    maxRiskScore: 80n,
    minLiquidityScore: 20n,
    defaultFee: 3000,
    maxFee: 10000,
    publisherShareBps: 500,
    blockHighRiskTrades: false,
    allowSwapWhenSignalExpired: true,
    policyAdmin: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  };
}

function makeInput(actions: (SwapAction | HedgeAction | AddLiquidityAction | WaitAction | AlertAction)[]): SimulationInput {
  const policies = new Map<string, PoolPolicy>();
  policies.set(POOL_ID, makePolicy());
  const prices = new Map<string, number>();
  prices.set(WETH, 2000);
  prices.set(USDC, 1);
  return { portfolio: makePortfolio(), actions, poolPolicies: policies, prices };
}

describe("Action Schema", () => {
  it("swap action has correct shape", () => {
    const action: SwapAction = {
      type: "swap",
      poolId: POOL_ID,
      tokenIn: WETH,
      tokenOut: USDC,
      amountIn: 1000000000000000000n,
      direction: "sell",
      maxSlippageBps: 50,
    };
    expect(action.type).toBe("swap");
    expect(action.direction).toBe("sell");
  });

  it("wait action has correct shape", () => {
    const action: WaitAction = { type: "wait", reason: "market volatile", durationMs: 60000 };
    expect(action.type).toBe("wait");
  });

  it("alert action has correct shape", () => {
    const action: AlertAction = { type: "alert", level: "warning", message: "High risk" };
    expect(action.type).toBe("alert");
    expect(action.level).toBe("warning");
  });
});

describe("Simulation", () => {
  it("returns before/after snapshots for swap", () => {
    const result = simulateActions(makeInput([{
      type: "swap",
      poolId: POOL_ID,
      tokenIn: WETH,
      tokenOut: USDC,
      amountIn: 1000000000000000000n,
      direction: "sell",
      maxSlippageBps: 50,
    }]));
    expect(result.before.totalValueUsd).toBeGreaterThan(0);
    expect(result.after.totalValueUsd).toBeGreaterThan(0);
    expect(result.feasible).toBe(true);
  });

  it("detects infeasible trade (insufficient balance)", () => {
    const result = simulateActions(makeInput([{
      type: "swap",
      poolId: POOL_ID,
      tokenIn: WETH,
      tokenOut: USDC,
      amountIn: 100000000000000000000n,
      direction: "sell",
      maxSlippageBps: 50,
    }]));
    expect(result.feasible).toBe(false);
  });

  it("estimates fees from pool policy", () => {
    const result = simulateActions(makeInput([{
      type: "swap",
      poolId: POOL_ID,
      tokenIn: WETH,
      tokenOut: USDC,
      amountIn: 1000000000000000000n,
      direction: "sell",
      maxSlippageBps: 50,
    }]));
    expect(result.delta.feeEstimateUsd).toBeGreaterThan(0);
  });

  it("estimates slippage", () => {
    const result = simulateActions(makeInput([{
      type: "swap",
      poolId: POOL_ID,
      tokenIn: WETH,
      tokenOut: USDC,
      amountIn: 1000000000000000000n,
      direction: "sell",
      maxSlippageBps: 100,
    }]));
    expect(result.delta.slippageEstimateUsd).toBeGreaterThan(0);
  });

  it("warns on high risk exposure", () => {
    const input = makeInput([{
      type: "swap",
      poolId: POOL_ID,
      tokenIn: USDC,
      tokenOut: WETH,
      amountIn: 4500000000n,
      direction: "buy",
      maxSlippageBps: 50,
    }]);
    const result = simulateActions(input);
    expect(result.warnings.some((w) => w.includes("risk exposure"))).toBe(true);
  });

  it("warns on blockHighRiskTrades pool", () => {
    const input = makeInput([{
      type: "swap",
      poolId: POOL_ID,
      tokenIn: WETH,
      tokenOut: USDC,
      amountIn: 1000000000000000000n,
      direction: "sell",
      maxSlippageBps: 50,
    }]);
    input.poolPolicies.get(POOL_ID)!.blockHighRiskTrades = true;
    const result = simulateActions(input);
    expect(result.warnings.some((w) => w.includes("blockHighRiskTrades"))).toBe(true);
  });

  it("handles hedge action with ratio", () => {
    const result = simulateActions(makeInput([{
      type: "hedge",
      poolId: POOL_ID,
      tokenIn: WETH,
      tokenOut: USDC,
      amountIn: 2000000000000000000n,
      hedgeRatio: 0.5,
    }]));
    expect(result.feasible).toBe(true);
    expect(result.after.positions[0]!.balance).toBeLessThan(result.before.positions[0]!.balance);
  });

  it("handles wait and alert actions as no-ops", () => {
    const result = simulateActions(makeInput([
      { type: "wait", reason: "test", durationMs: 1000 },
      { type: "alert", level: "info", message: "test" },
    ]));
    expect(result.before.totalValueUsd).toBe(result.after.totalValueUsd);
    expect(result.feasible).toBe(true);
  });

  it("computes concentration change", () => {
    const result = simulateActions(makeInput([{
      type: "swap",
      poolId: POOL_ID,
      tokenIn: USDC,
      tokenOut: WETH,
      amountIn: 4000000000n,
      direction: "buy",
      maxSlippageBps: 50,
    }]));
    expect(result.delta.concentrationChange).not.toBe(0);
  });
});
