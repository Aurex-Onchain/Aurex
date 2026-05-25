import {
  createWalletClient,
  http,
  type WalletClient,
  type Address,
  type Hash,
  type Account,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { ContractAddresses, ChainConfig, AurexSignal } from "../types.js";

export interface ChainWriter {
  getAddress(): Address;
  registerPublisher(amount: bigint): Promise<Hash>;
  increaseStake(amount: bigint): Promise<Hash>;
  unregisterPublisher(): Promise<Hash>;
  publishSignal(signal: AurexSignal): Promise<Hash>;
  verifySignal(signalId: `0x${string}`): Promise<Hash>;
  claimFees(token: Address): Promise<Hash>;
  approveToken(token: Address, spender: Address, amount: bigint): Promise<Hash>;
}

export const signalRegistryWriteAbi = [
  {
    type: "function",
    name: "registerPublisher",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "increaseStake",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unregisterPublisher",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "publishSignal",
    inputs: [{ name: "signal", type: "tuple", components: [
      { name: "signalId", type: "bytes32" },
      { name: "poolId", type: "bytes32" },
      { name: "riskScore", type: "uint256" },
      { name: "alphaScore", type: "uint256" },
      { name: "liquidityScore", type: "uint256" },
      { name: "volatilityScore", type: "uint256" },
      { name: "recommendedFee", type: "uint24" },
      { name: "expiresAt", type: "uint64" },
      { name: "signer", type: "address" },
    ]}],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "verifySignal",
    inputs: [{ name: "signalId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const alphaHookWriteAbi = [
  {
    type: "function",
    name: "claimFees",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const erc20WriteAbi = [
  {
    type: "function",
    name: "approve",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

export function createChainWriter(
  chainConfig: ChainConfig,
  contracts: ContractAddresses,
  privateKey: `0x${string}`,
): ChainWriter {
  const account: Account = privateKeyToAccount(privateKey);

  const client: WalletClient = createWalletClient({
    account,
    transport: http(chainConfig.rpcUrl),
  });

  const publicClient = client.extend(publicActions);

  async function writeContract(
    address: Address,
    abi: readonly unknown[],
    functionName: string,
    args: unknown[] = [],
  ): Promise<Hash> {
    const { request } = await publicClient.simulateContract({
      account,
      address,
      abi: abi as never,
      functionName,
      args,
    } as never);
    return publicClient.writeContract(request as never);
  }

  return {
    getAddress() {
      return account.address;
    },

    async registerPublisher(amount) {
      return writeContract(
        contracts.signalRegistry,
        signalRegistryWriteAbi,
        "registerPublisher",
        [amount],
      );
    },

    async increaseStake(amount) {
      return writeContract(
        contracts.signalRegistry,
        signalRegistryWriteAbi,
        "increaseStake",
        [amount],
      );
    },

    async unregisterPublisher() {
      return writeContract(
        contracts.signalRegistry,
        signalRegistryWriteAbi,
        "unregisterPublisher",
      );
    },

    async publishSignal(signal) {
      return writeContract(
        contracts.signalRegistry,
        signalRegistryWriteAbi,
        "publishSignal",
        [signal],
      );
    },

    async verifySignal(signalId) {
      return writeContract(
        contracts.signalRegistry,
        signalRegistryWriteAbi,
        "verifySignal",
        [signalId],
      );
    },

    async claimFees(token) {
      return writeContract(
        contracts.alphaHook,
        alphaHookWriteAbi,
        "claimFees",
        [token],
      );
    },

    async approveToken(token, spender, amount) {
      return writeContract(
        token,
        erc20WriteAbi,
        "approve",
        [spender, amount],
      );
    },
  };
}
