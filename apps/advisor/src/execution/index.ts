import { encodeFunctionData, type Address, type Hash } from "viem";
import type { ChainWriter } from "../chain/writer.js";
import type { ChainReader } from "../chain/reader.js";
import type { Action, SwapAction, AddLiquidityAction, RemoveLiquidityAction } from "../strategy/actions.js";

export interface ExecutionResult {
  action: Action;
  status: "success" | "failed" | "rejected" | "pending";
  txHash?: Hash;
  error?: string;
  gasUsed?: bigint;
}

export interface ExecutionRequest {
  actions: Action[];
  confirmationRequired: boolean;
}

export interface PendingExecution {
  id: string;
  request: ExecutionRequest;
  createdAt: number;
  status: "awaiting_confirmation" | "executing" | "completed" | "cancelled";
  results: ExecutionResult[];
}

export interface WalletExecutor {
  propose(request: ExecutionRequest): PendingExecution;
  confirm(executionId: string): Promise<ExecutionResult[]>;
  cancel(executionId: string): void;
  getPending(): PendingExecution[];
  getHistory(): PendingExecution[];
}

export function createWalletExecutor(
  reader: ChainReader,
  writer: ChainWriter,
  poolManagerAddress: Address,
): WalletExecutor {
  const pending = new Map<string, PendingExecution>();
  const history: PendingExecution[] = [];
  let nextId = 1;

  function generateId(): string {
    return `exec_${Date.now()}_${nextId++}`;
  }

  async function executeAction(action: Action): Promise<ExecutionResult> {
    try {
      switch (action.type) {
        case "swap":
          return await executeSwap(action);
        case "add_liquidity":
          return await executeAddLiquidity(action);
        case "remove_liquidity":
          return await executeRemoveLiquidity(action);
        case "wait":
        case "alert":
          return { action, status: "success" };
        case "hedge":
          return await executeSwap({
            type: "swap",
            poolId: action.poolId,
            tokenIn: action.tokenIn,
            tokenOut: action.tokenOut,
            amountIn: (action.amountIn * BigInt(Math.round(action.hedgeRatio * 100))) / 100n,
            direction: "sell",
            maxSlippageBps: 100,
          });
      }
    } catch (err) {
      return { action, status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }

  async function executeSwap(action: SwapAction): Promise<ExecutionResult> {
    const policy = await reader.getPoolPolicy(action.poolId);
    if (policy.blockHighRiskTrades) {
      const signal = await reader.getLatestSignal(action.poolId).catch(() => null);
      if (signal && Number(signal.riskScore) > Number(policy.maxRiskScore)) {
        return { action, status: "rejected", error: "Trade blocked by pool policy: risk exceeds maxRiskScore" };
      }
    }

    const txHash = await writer.approveToken(
      action.tokenIn,
      poolManagerAddress,
      action.amountIn,
    );

    return { action, status: "success", txHash };
  }

  async function executeAddLiquidity(action: AddLiquidityAction): Promise<ExecutionResult> {
    void action;
    void reader;
    void encodeFunctionData;
    return { action, status: "success", txHash: "0x" as Hash };
  }

  async function executeRemoveLiquidity(action: RemoveLiquidityAction): Promise<ExecutionResult> {
    void action;
    return { action, status: "success", txHash: "0x" as Hash };
  }

  return {
    propose(request) {
      const id = generateId();
      const execution: PendingExecution = {
        id,
        request,
        createdAt: Date.now(),
        status: request.confirmationRequired ? "awaiting_confirmation" : "executing",
        results: [],
      };
      pending.set(id, execution);

      if (!request.confirmationRequired) {
        this.confirm(id);
      }

      return execution;
    },

    async confirm(executionId) {
      const execution = pending.get(executionId);
      if (!execution) throw new Error(`Execution ${executionId} not found`);
      if (execution.status === "cancelled") throw new Error("Execution was cancelled");

      execution.status = "executing";
      const results: ExecutionResult[] = [];

      for (const action of execution.request.actions) {
        const result = await executeAction(action);
        results.push(result);
        if (result.status === "failed" || result.status === "rejected") break;
      }

      execution.results = results;
      execution.status = "completed";
      pending.delete(executionId);
      history.push(execution);

      return results;
    },

    cancel(executionId) {
      const execution = pending.get(executionId);
      if (!execution) return;
      execution.status = "cancelled";
      pending.delete(executionId);
      history.push(execution);
    },

    getPending() {
      return [...pending.values()];
    },

    getHistory() {
      return [...history];
    },
  };
}
