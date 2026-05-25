import type { Action, SwapAction, AddLiquidityAction, RemoveLiquidityAction, HedgeAction } from "./actions.js";
import type { PoolPolicy } from "../types.js";

export interface PortfolioPosition {
  token: `0x${string}`;
  symbol: string;
  balance: bigint;
  valueUsd: number;
}

export interface PortfolioSnapshot {
  positions: PortfolioPosition[];
  totalValueUsd: number;
  riskExposure: number;
  concentrationPercent: number;
  maxDrawdownPercent: number;
}

export interface SimulationResult {
  before: PortfolioSnapshot;
  after: PortfolioSnapshot;
  delta: {
    valueChangeUsd: number;
    riskExposureChange: number;
    concentrationChange: number;
    feeEstimateUsd: number;
    slippageEstimateUsd: number;
  };
  warnings: string[];
  feasible: boolean;
}

export interface SimulationInput {
  portfolio: PortfolioPosition[];
  actions: Action[];
  poolPolicies: Map<string, PoolPolicy>;
  prices: Map<string, number>;
}

export function simulateActions(input: SimulationInput): SimulationResult {
  const { portfolio, actions, poolPolicies, prices } = input;

  const before = computeSnapshot(portfolio, prices);
  const afterPositions = applyActions(portfolio, actions, poolPolicies, prices);
  const after = computeSnapshot(afterPositions, prices);

  const warnings: string[] = [];
  const feeEstimate = estimateFees(actions, poolPolicies);
  const slippageEstimate = estimateSlippage(actions, prices);

  if (after.riskExposure > 80) warnings.push("Post-trade risk exposure exceeds 80%");
  if (after.concentrationPercent > 70) warnings.push("Post-trade concentration exceeds 70%");
  if (after.maxDrawdownPercent > 20) warnings.push("Estimated max drawdown exceeds 20%");

  for (const action of actions) {
    if (action.type === "swap" || action.type === "hedge") {
      const policy = poolPolicies.get(action.poolId);
      if (policy?.blockHighRiskTrades) {
        warnings.push(`Pool ${action.poolId.slice(0, 10)}... has blockHighRiskTrades enabled`);
      }
    }
  }

  const feasible = !afterPositions.some((p) => p.balance < 0n);

  return {
    before,
    after,
    delta: {
      valueChangeUsd: after.totalValueUsd - before.totalValueUsd - feeEstimate - slippageEstimate,
      riskExposureChange: after.riskExposure - before.riskExposure,
      concentrationChange: after.concentrationPercent - before.concentrationPercent,
      feeEstimateUsd: feeEstimate,
      slippageEstimateUsd: slippageEstimate,
    },
    warnings,
    feasible,
  };
}

function computeSnapshot(positions: PortfolioPosition[], prices: Map<string, number>): PortfolioSnapshot {
  const valued = positions.map((p) => ({
    ...p,
    valueUsd: p.valueUsd > 0 ? p.valueUsd : Number(p.balance) * (prices.get(p.token) ?? 0) / 1e18,
  }));

  const totalValueUsd = valued.reduce((sum, p) => sum + p.valueUsd, 0);

  const maxPosition = valued.reduce((max, p) => Math.max(max, p.valueUsd), 0);
  const concentrationPercent = totalValueUsd > 0 ? (maxPosition / totalValueUsd) * 100 : 0;

  const volatileTokens = valued.filter((p) => p.symbol !== "USDC" && p.symbol !== "USDT");
  const volatileValue = volatileTokens.reduce((sum, p) => sum + p.valueUsd, 0);
  const riskExposure = totalValueUsd > 0 ? (volatileValue / totalValueUsd) * 100 : 0;

  const maxDrawdownPercent = riskExposure * 0.3;

  return { positions: valued, totalValueUsd, riskExposure, concentrationPercent, maxDrawdownPercent };
}

function applyActions(
  positions: PortfolioPosition[],
  actions: Action[],
  _policies: Map<string, PoolPolicy>,
  prices: Map<string, number>,
): PortfolioPosition[] {
  const result = positions.map((p) => ({ ...p }));

  for (const action of actions) {
    if (action.type === "swap" || action.type === "hedge") {
      applySwapLike(result, action, prices);
    } else if (action.type === "add_liquidity") {
      applyAddLiquidity(result, action);
    } else if (action.type === "remove_liquidity") {
      applyRemoveLiquidity(result, action);
    }
  }

  return result;
}

function applySwapLike(
  positions: PortfolioPosition[],
  action: SwapAction | HedgeAction,
  prices: Map<string, number>,
): void {
  const inPos = positions.find((p) => p.token === action.tokenIn);
  const outPos = positions.find((p) => p.token === action.tokenOut);

  const amount = action.type === "hedge"
    ? (action.amountIn * BigInt(Math.round(action.hedgeRatio * 100))) / 100n
    : action.amountIn;

  if (inPos) {
    inPos.balance -= amount;
    inPos.valueUsd = Number(inPos.balance) * (prices.get(inPos.token) ?? 0) / 1e18;
  }

  if (outPos) {
    const inPrice = prices.get(action.tokenIn) ?? 0;
    const outPrice = prices.get(action.tokenOut) ?? 1;
    const outAmount = (Number(amount) / 1e18 * inPrice / outPrice) * 1e18;
    outPos.balance += BigInt(Math.round(outAmount));
    outPos.valueUsd = Number(outPos.balance) * (prices.get(outPos.token) ?? 0) / 1e18;
  }
}

function applyAddLiquidity(positions: PortfolioPosition[], action: AddLiquidityAction): void {
  const pos0 = positions.find((p) => p.token === action.poolId);
  if (pos0) pos0.balance -= action.token0Amount;
}

function applyRemoveLiquidity(_positions: PortfolioPosition[], _action: RemoveLiquidityAction): void {
  void _action;
}

function estimateFees(actions: Action[], policies: Map<string, PoolPolicy>): number {
  let totalFee = 0;
  for (const action of actions) {
    if (action.type === "swap" || action.type === "hedge") {
      const policy = policies.get(action.poolId);
      const feeBps = policy ? policy.defaultFee / 100 : 30;
      const amount = action.type === "hedge"
        ? Number(action.amountIn) * action.hedgeRatio / 1e18
        : Number(action.amountIn) / 1e18;
      totalFee += amount * feeBps / 10000;
    }
  }
  return totalFee;
}

function estimateSlippage(actions: Action[], _prices: Map<string, number>): number {
  let totalSlippage = 0;
  for (const action of actions) {
    if (action.type === "swap") {
      const amountUsd = Number(action.amountIn) / 1e18;
      totalSlippage += amountUsd * (action.maxSlippageBps / 10000) * 0.5;
    }
  }
  return totalSlippage;
}
