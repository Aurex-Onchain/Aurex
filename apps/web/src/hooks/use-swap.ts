"use client";

import { useState } from "react";
import { postApi } from "@/lib/api";
import type { ExecutionResult } from "@/components/terminal/swap-result";

interface SwapParams {
  poolId: string;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amount: string;
  direction: string;
}

export function useSwap() {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function execute(params: SwapParams) {
    setIsPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await postApi<ExecutionResult & { error?: string }>("/api/execute", {
        pool_id: params.poolId,
        action_type: "swap",
        direction: params.direction,
        amount: params.amount,
        token_in: params.tokenIn,
        token_out: params.tokenOut,
        confirm: true,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPending(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { execute, result, isPending, error, reset };
}
