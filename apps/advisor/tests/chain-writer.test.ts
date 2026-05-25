import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainWriter, type ChainWriter } from "../src/chain/writer.js";
import type { ContractAddresses, ChainConfig, AurexSignal } from "../src/types.js";

const mockSimulateContract = vi.fn();
const mockWriteContract = vi.fn();

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createWalletClient: () => ({
      extend: () => ({
        simulateContract: mockSimulateContract,
        writeContract: mockWriteContract,
      }),
    }),
  };
});

vi.mock("viem/accounts", () => ({
  privateKeyToAccount: () => ({
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  }),
}));

const chainConfig: ChainConfig = {
  rpcUrl: "http://localhost:8545",
  chainId: 196,
};

const contracts: ContractAddresses = {
  signalRegistry: "0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f",
  policyManager: "0x025774B4e49b7Cb98D90111461B69Af98c301cD7",
  alphaHook: "0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0",
  poolFactory: "0x6708213b47715771e290e41599de14e45E8C4358",
  poolManager: "0x360e68faccca8ca495c1b759fd9eee466db9fb32",
  aurexToken: "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82",
};

const TEST_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;
const TX_HASH = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as `0x${string}`;

describe("ChainWriter", () => {
  let writer: ChainWriter;

  beforeEach(() => {
    mockSimulateContract.mockReset();
    mockWriteContract.mockReset();
    mockSimulateContract.mockResolvedValue({ request: {} });
    mockWriteContract.mockResolvedValue(TX_HASH);
    writer = createChainWriter(chainConfig, contracts, TEST_KEY);
  });

  describe("getAddress", () => {
    it("returns the account address", () => {
      expect(writer.getAddress()).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    });
  });

  describe("registerPublisher", () => {
    it("simulates and writes registerPublisher", async () => {
      const hash = await writer.registerPublisher(100000000000000000000n);
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: contracts.signalRegistry,
          functionName: "registerPublisher",
          args: [100000000000000000000n],
        }),
      );
      expect(hash).toBe(TX_HASH);
    });
  });

  describe("increaseStake", () => {
    it("simulates and writes increaseStake", async () => {
      const hash = await writer.increaseStake(50000000000000000000n);
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: contracts.signalRegistry,
          functionName: "increaseStake",
          args: [50000000000000000000n],
        }),
      );
      expect(hash).toBe(TX_HASH);
    });
  });

  describe("unregisterPublisher", () => {
    it("simulates and writes unregisterPublisher", async () => {
      const hash = await writer.unregisterPublisher();
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: contracts.signalRegistry,
          functionName: "unregisterPublisher",
        }),
      );
      expect(hash).toBe(TX_HASH);
    });
  });

  describe("publishSignal", () => {
    it("simulates and writes publishSignal with signal struct", async () => {
      const signal: AurexSignal = {
        signalId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        poolId: "0x2222222222222222222222222222222222222222222222222222222222222222",
        riskScore: 45n,
        alphaScore: 72n,
        liquidityScore: 80n,
        volatilityScore: 35n,
        recommendedFee: 5000,
        expiresAt: 1700003600n,
        signer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      };
      const hash = await writer.publishSignal(signal);
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: contracts.signalRegistry,
          functionName: "publishSignal",
          args: [signal],
        }),
      );
      expect(hash).toBe(TX_HASH);
    });
  });

  describe("verifySignal", () => {
    it("simulates and writes verifySignal", async () => {
      const signalId = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as `0x${string}`;
      const hash = await writer.verifySignal(signalId);
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: contracts.signalRegistry,
          functionName: "verifySignal",
          args: [signalId],
        }),
      );
      expect(hash).toBe(TX_HASH);
    });
  });

  describe("claimFees", () => {
    it("simulates and writes claimFees on alphaHook", async () => {
      const token = "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82" as `0x${string}`;
      const hash = await writer.claimFees(token);
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: contracts.alphaHook,
          functionName: "claimFees",
          args: [token],
        }),
      );
      expect(hash).toBe(TX_HASH);
    });
  });

  describe("approveToken", () => {
    it("simulates and writes approve on token contract", async () => {
      const token = "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82" as `0x${string}`;
      const spender = contracts.signalRegistry;
      const amount = 1000000000000000000000n;
      const hash = await writer.approveToken(token, spender, amount);
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: token,
          functionName: "approve",
          args: [spender, amount],
        }),
      );
      expect(hash).toBe(TX_HASH);
    });
  });

  describe("error handling", () => {
    it("propagates simulation errors", async () => {
      mockSimulateContract.mockRejectedValueOnce(new Error("execution reverted: insufficient stake"));
      await expect(writer.registerPublisher(1n)).rejects.toThrow("insufficient stake");
    });

    it("propagates write errors", async () => {
      mockWriteContract.mockRejectedValueOnce(new Error("nonce too low"));
      await expect(writer.registerPublisher(100n)).rejects.toThrow("nonce too low");
    });
  });
});
