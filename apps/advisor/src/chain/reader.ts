import { createPublicClient, http, type PublicClient, type Address } from "viem";
import { signalRegistryAbi, policyManagerAbi, alphaHookAbi, poolManagerAbi, erc20Abi } from "./abis.js";
import type { ContractAddresses, ChainConfig, AurexSignal, PublisherInfo, PoolPolicy, SignalRecord } from "../types.js";

export interface ChainReader {
  getLatestSignal(poolId: `0x${string}`): Promise<AurexSignal>;
  getSignalsByPool(poolIds: `0x${string}`[]): Promise<AurexSignal[]>;
  isSignalValid(poolId: `0x${string}`): Promise<boolean>;
  getSignalCount(poolId: `0x${string}`): Promise<bigint>;
  getPublisherInfo(publisher: Address): Promise<PublisherInfo>;
  getPublisherCount(): Promise<bigint>;
  getPublisherList(offset: bigint, limit: bigint): Promise<Address[]>;
  getPoolPolicy(poolId: `0x${string}`): Promise<PoolPolicy>;
  hasPolicy(poolId: `0x${string}`): Promise<boolean>;
  getSlot0Price(poolId: `0x${string}`): Promise<bigint>;
  getClaimable(publisher: Address, token: Address): Promise<bigint>;
  getTokenBalance(token: Address, account: Address): Promise<bigint>;
  getTokenSymbol(token: Address): Promise<string>;
  getSignalRecord(signalId: `0x${string}`): Promise<SignalRecord>;
}

export function createChainReader(
  chainConfig: ChainConfig,
  contracts: ContractAddresses,
): ChainReader {
  const client: PublicClient = createPublicClient({
    transport: http(chainConfig.rpcUrl),
  });

  return {
    async getLatestSignal(poolId) {
      const result = await client.readContract({
        address: contracts.signalRegistry,
        abi: signalRegistryAbi,
        functionName: "getLatestSignal",
        args: [poolId],
      });
      return result as unknown as AurexSignal;
    },

    async getSignalsByPool(poolIds) {
      const result = await client.readContract({
        address: contracts.signalRegistry,
        abi: signalRegistryAbi,
        functionName: "getSignalsByPool",
        args: [poolIds],
      });
      return result as unknown as AurexSignal[];
    },

    async isSignalValid(poolId) {
      return client.readContract({
        address: contracts.signalRegistry,
        abi: signalRegistryAbi,
        functionName: "isSignalValid",
        args: [poolId],
      });
    },

    async getSignalCount(poolId) {
      return client.readContract({
        address: contracts.signalRegistry,
        abi: signalRegistryAbi,
        functionName: "getSignalCount",
        args: [poolId],
      });
    },

    async getPublisherInfo(publisher) {
      const result = await client.readContract({
        address: contracts.signalRegistry,
        abi: signalRegistryAbi,
        functionName: "getPublisherInfo",
        args: [publisher],
      });
      return result as unknown as PublisherInfo;
    },

    async getPublisherCount() {
      return client.readContract({
        address: contracts.signalRegistry,
        abi: signalRegistryAbi,
        functionName: "getPublisherCount",
      });
    },

    async getPublisherList(offset, limit) {
      return client.readContract({
        address: contracts.signalRegistry,
        abi: signalRegistryAbi,
        functionName: "getPublisherList",
        args: [offset, limit],
      }) as Promise<Address[]>;
    },

    async getPoolPolicy(poolId) {
      const result = await client.readContract({
        address: contracts.policyManager,
        abi: policyManagerAbi,
        functionName: "getPolicy",
        args: [poolId],
      });
      return result as unknown as PoolPolicy;
    },

    async hasPolicy(poolId) {
      return client.readContract({
        address: contracts.policyManager,
        abi: policyManagerAbi,
        functionName: "hasPolicy",
        args: [poolId],
      });
    },

    async getSlot0Price(poolId) {
      const result = await client.readContract({
        address: contracts.poolManager,
        abi: poolManagerAbi,
        functionName: "getSlot0",
        args: [poolId],
      });
      return (result as [bigint, number, number, number])[0];
    },

    async getClaimable(publisher, token) {
      return client.readContract({
        address: contracts.alphaHook,
        abi: alphaHookAbi,
        functionName: "getClaimable",
        args: [publisher, token],
      });
    },

    async getTokenBalance(token, account) {
      return client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      });
    },

    async getTokenSymbol(token) {
      return client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "symbol",
      });
    },

    async getSignalRecord(signalId) {
      const result = await client.readContract({
        address: contracts.signalRegistry,
        abi: signalRegistryAbi,
        functionName: "getSignalRecord",
        args: [signalId],
      });
      return result as unknown as SignalRecord;
    },
  };
}
