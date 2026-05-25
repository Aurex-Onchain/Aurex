"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, poolFactoryAbi } from "@/lib/contracts";
import type { PolicyValues } from "@/components/create-pool/policy-form";

interface CreatePoolParams {
  token0: `0x${string}`;
  token1: `0x${string}`;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  policy: PolicyValues;
  admin: `0x${string}`;
}

export function useCreatePool() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function createPool(params: CreatePoolParams) {
    const [t0, t1] =
      params.token0.toLowerCase() < params.token1.toLowerCase()
        ? [params.token0, params.token1]
        : [params.token1, params.token0];

    writeContract({
      address: CONTRACTS.poolFactory,
      abi: poolFactoryAbi,
      functionName: "createPool",
      args: [
        t0,
        t1,
        params.tickSpacing,
        params.sqrtPriceX96,
        {
          maxRiskScore: BigInt(params.policy.maxRiskScore || "80"),
          minLiquidityScore: BigInt(params.policy.minLiquidityScore || "20"),
          defaultFee: Number(params.policy.defaultFee || "3000"),
          maxFee: Number(params.policy.maxFee || "10000"),
          publisherShareBps: Number(params.policy.publisherShareBps || "500"),
          blockHighRiskTrades: params.policy.blockHighRiskTrades,
          allowSwapWhenSignalExpired: params.policy.allowSwapWhenSignalExpired,
          policyAdmin: params.admin,
        },
      ],
    });
  }

  return { createPool, hash, isPending, isConfirming, isSuccess, error, reset };
}
