export type ActionType = "swap" | "add_liquidity" | "remove_liquidity" | "wait" | "hedge" | "alert";

export interface SwapAction {
  type: "swap";
  poolId: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  direction: "buy" | "sell";
  maxSlippageBps: number;
}

export interface AddLiquidityAction {
  type: "add_liquidity";
  poolId: `0x${string}`;
  token0Amount: bigint;
  token1Amount: bigint;
  tickLower: number;
  tickUpper: number;
}

export interface RemoveLiquidityAction {
  type: "remove_liquidity";
  poolId: `0x${string}`;
  liquidityPercent: number;
}

export interface WaitAction {
  type: "wait";
  reason: string;
  durationMs: number;
}

export interface HedgeAction {
  type: "hedge";
  poolId: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  hedgeRatio: number;
}

export interface AlertAction {
  type: "alert";
  level: "info" | "warning" | "critical";
  message: string;
}

export type Action =
  | SwapAction
  | AddLiquidityAction
  | RemoveLiquidityAction
  | WaitAction
  | HedgeAction
  | AlertAction;

export interface ActionProposal {
  actions: Action[];
  reasoning: string;
  estimatedGasCost: bigint;
  confidence: number;
}
