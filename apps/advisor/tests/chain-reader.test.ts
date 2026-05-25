import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainReader, type ChainReader } from "../src/chain/index.js";
import type { ContractAddresses, ChainConfig } from "../src/types.js";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  const mockReadContract = vi.fn();
  return {
    ...actual,
    createPublicClient: () => ({
      readContract: mockReadContract,
    }),
    __mockReadContract: mockReadContract,
  };
});

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

async function getMockReadContract() {
  const viem = await import("viem");
  return (viem as unknown as { __mockReadContract: ReturnType<typeof vi.fn> }).__mockReadContract;
}

describe("ChainReader", () => {
  let reader: ChainReader;
  let mockRead: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockRead = await getMockReadContract();
    mockRead.mockReset();
    reader = createChainReader(chainConfig, contracts);
  });

  describe("getLatestSignal", () => {
    it("calls signalRegistry with correct args", async () => {
      const poolId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;
      const mockSignal = {
        signalId: poolId,
        poolId,
        riskScore: 42n,
        alphaScore: 81n,
        liquidityScore: 70n,
        volatilityScore: 30n,
        recommendedFee: 5000,
        expiresAt: 1700000000n,
        signer: "0xAA00000000000000000000000000000000000000",
      };
      mockRead.mockResolvedValueOnce(mockSignal);

      const result = await reader.getLatestSignal(poolId);

      expect(mockRead).toHaveBeenCalledWith({
        address: contracts.signalRegistry,
        abi: expect.any(Array),
        functionName: "getLatestSignal",
        args: [poolId],
      });
      expect(result.riskScore).toBe(42n);
      expect(result.alphaScore).toBe(81n);
    });
  });

  describe("getSignalsByPool", () => {
    it("returns array of signals for multiple pools", async () => {
      const poolId1 = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;
      const poolId2 = "0x2222222222222222222222222222222222222222222222222222222222222222" as `0x${string}`;
      const mockSignals = [
        { signalId: poolId1, poolId: poolId1, riskScore: 30n, alphaScore: 70n, liquidityScore: 80n, volatilityScore: 20n, recommendedFee: 3000, expiresAt: 1700000000n, signer: "0xAA00000000000000000000000000000000000000" },
        { signalId: poolId2, poolId: poolId2, riskScore: 60n, alphaScore: 40n, liquidityScore: 50n, volatilityScore: 50n, recommendedFee: 7000, expiresAt: 1700000000n, signer: "0xAA00000000000000000000000000000000000000" },
      ];
      mockRead.mockResolvedValueOnce(mockSignals);

      const result = await reader.getSignalsByPool([poolId1, poolId2]);

      expect(result).toHaveLength(2);
      expect(result[0]!.riskScore).toBe(30n);
      expect(result[1]!.riskScore).toBe(60n);
    });
  });

  describe("isSignalValid", () => {
    it("returns boolean", async () => {
      const poolId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;
      mockRead.mockResolvedValueOnce(true);

      const result = await reader.isSignalValid(poolId);
      expect(result).toBe(true);
    });
  });

  describe("getPublisherInfo", () => {
    it("returns publisher struct", async () => {
      const publisher = "0xAA00000000000000000000000000000000000000" as `0x${string}`;
      const mockInfo = {
        stakeAmount: 100000000000000000000n,
        signalCount: 5n,
        accuracyScore: 72n,
        slashCount: 1n,
        registeredAt: 1700000000n,
        active: true,
      };
      mockRead.mockResolvedValueOnce(mockInfo);

      const result = await reader.getPublisherInfo(publisher);

      expect(result.stakeAmount).toBe(100000000000000000000n);
      expect(result.accuracyScore).toBe(72n);
      expect(result.active).toBe(true);
    });
  });

  describe("getPublisherCount", () => {
    it("returns count", async () => {
      mockRead.mockResolvedValueOnce(3n);
      const result = await reader.getPublisherCount();
      expect(result).toBe(3n);
    });
  });

  describe("getPublisherList", () => {
    it("returns address array", async () => {
      const addresses = [
        "0xAA00000000000000000000000000000000000000",
        "0xBB00000000000000000000000000000000000000",
      ];
      mockRead.mockResolvedValueOnce(addresses);

      const result = await reader.getPublisherList(0n, 10n);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(addresses[0]);
    });
  });

  describe("getPoolPolicy", () => {
    it("returns policy struct", async () => {
      const poolId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;
      const mockPolicy = {
        maxRiskScore: 70n,
        minLiquidityScore: 20n,
        defaultFee: 3000,
        maxFee: 10000,
        publisherShareBps: 500,
        blockHighRiskTrades: true,
        allowSwapWhenSignalExpired: true,
        policyAdmin: "0xCC00000000000000000000000000000000000000",
      };
      mockRead.mockResolvedValueOnce(mockPolicy);

      const result = await reader.getPoolPolicy(poolId);

      expect(result.maxRiskScore).toBe(70n);
      expect(result.publisherShareBps).toBe(500);
      expect(result.blockHighRiskTrades).toBe(true);
    });
  });

  describe("getSlot0Price", () => {
    it("returns sqrtPriceX96 from slot0 tuple", async () => {
      const poolId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;
      const sqrtPrice = 79228162514264337593543950336n;
      mockRead.mockResolvedValueOnce([sqrtPrice, -100, 0, 3000]);

      const result = await reader.getSlot0Price(poolId);
      expect(result).toBe(sqrtPrice);
    });
  });

  describe("getClaimable", () => {
    it("returns claimable amount", async () => {
      const publisher = "0xAA00000000000000000000000000000000000000" as `0x${string}`;
      const token = "0x4229Df8c78F60D1Daf54035E01527B9B025C231d" as `0x${string}`;
      mockRead.mockResolvedValueOnce(50000000000000000n);

      const result = await reader.getClaimable(publisher, token);
      expect(result).toBe(50000000000000000n);
    });
  });

  describe("getTokenBalance", () => {
    it("returns balance", async () => {
      const token = "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82" as `0x${string}`;
      const account = "0xAA00000000000000000000000000000000000000" as `0x${string}`;
      mockRead.mockResolvedValueOnce(1000000000000000000000n);

      const result = await reader.getTokenBalance(token, account);
      expect(result).toBe(1000000000000000000000n);
    });
  });

  describe("getTokenSymbol", () => {
    it("returns symbol string", async () => {
      const token = "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82" as `0x${string}`;
      mockRead.mockResolvedValueOnce("AUREX");

      const result = await reader.getTokenSymbol(token);
      expect(result).toBe("AUREX");
    });
  });
});
