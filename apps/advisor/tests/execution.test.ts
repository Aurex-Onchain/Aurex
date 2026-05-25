import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWalletExecutor, type WalletExecutor } from "../src/execution/index.js";
import type { ChainReader } from "../src/chain/reader.js";
import type { ChainWriter } from "../src/chain/writer.js";

const PUBLISHER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`;
const POOL_ID = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;
const WETH = "0x2222222222222222222222222222222222222222" as `0x${string}`;
const USDC = "0x3333333333333333333333333333333333333333" as `0x${string}`;
const POOL_MANAGER = "0x4444444444444444444444444444444444444444" as `0x${string}`;

function createMockReader(): ChainReader {
  return {
    getLatestSignal: vi.fn().mockResolvedValue({
      signalId: POOL_ID, poolId: POOL_ID, riskScore: 42n, alphaScore: 81n,
      liquidityScore: 70n, volatilityScore: 30n, recommendedFee: 5000, expiresAt: 1700000000n, signer: PUBLISHER,
    }),
    getSignalsByPool: vi.fn().mockResolvedValue([]),
    isSignalValid: vi.fn().mockResolvedValue(true),
    getSignalCount: vi.fn().mockResolvedValue(1n),
    getPublisherInfo: vi.fn().mockResolvedValue({
      stakeAmount: 100000000000000000000n, signalCount: 5n, accuracyScore: 72n,
      slashCount: 1n, registeredAt: 1700000000n, active: true,
    }),
    getPublisherCount: vi.fn().mockResolvedValue(1n),
    getPublisherList: vi.fn().mockResolvedValue([PUBLISHER]),
    getPoolPolicy: vi.fn().mockResolvedValue({
      maxRiskScore: 80n, minLiquidityScore: 20n, defaultFee: 3000, maxFee: 10000,
      publisherShareBps: 500, blockHighRiskTrades: false, allowSwapWhenSignalExpired: true, policyAdmin: PUBLISHER,
    }),
    hasPolicy: vi.fn().mockResolvedValue(true),
    getSlot0Price: vi.fn().mockResolvedValue(79228162514264337593543950336n),
    getClaimable: vi.fn().mockResolvedValue(50000000000000000n),
    getTokenBalance: vi.fn().mockResolvedValue(1000000000000000000000n),
    getTokenSymbol: vi.fn().mockResolvedValue("AUREX"),
  };
}

function createMockWriter(): ChainWriter {
  return {
    getAddress: vi.fn().mockReturnValue(PUBLISHER),
    registerPublisher: vi.fn().mockResolvedValue("0xaaa" as `0x${string}`),
    increaseStake: vi.fn().mockResolvedValue("0xbbb" as `0x${string}`),
    unregisterPublisher: vi.fn().mockResolvedValue("0xccc" as `0x${string}`),
    publishSignal: vi.fn().mockResolvedValue("0xddd" as `0x${string}`),
    verifySignal: vi.fn().mockResolvedValue("0xeee" as `0x${string}`),
    claimFees: vi.fn().mockResolvedValue("0xfff" as `0x${string}`),
    approveToken: vi.fn().mockResolvedValue("0x111" as `0x${string}`),
  };
}

describe("WalletExecutor", () => {
  let executor: WalletExecutor;
  let reader: ChainReader;
  let writer: ChainWriter;

  beforeEach(() => {
    reader = createMockReader();
    writer = createMockWriter();
    executor = createWalletExecutor(reader, writer, POOL_MANAGER);
  });

  it("proposes execution with confirmation required", () => {
    const execution = executor.propose({
      actions: [{ type: "swap", poolId: POOL_ID, tokenIn: WETH, tokenOut: USDC, amountIn: 1000000000000000000n, direction: "sell", maxSlippageBps: 50 }],
      confirmationRequired: true,
    });
    expect(execution.status).toBe("awaiting_confirmation");
    expect(execution.id).toContain("exec_");
  });

  it("confirms and executes swap", async () => {
    const execution = executor.propose({
      actions: [{ type: "swap", poolId: POOL_ID, tokenIn: WETH, tokenOut: USDC, amountIn: 1000000000000000000n, direction: "sell", maxSlippageBps: 50 }],
      confirmationRequired: true,
    });
    const results = await executor.confirm(execution.id);
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("success");
    expect(results[0]!.txHash).toBe("0x111");
  });

  it("rejects swap when pool blocks high risk trades", async () => {
    (reader.getPoolPolicy as ReturnType<typeof vi.fn>).mockResolvedValue({
      maxRiskScore: 40n, minLiquidityScore: 20n, defaultFee: 3000, maxFee: 10000,
      publisherShareBps: 500, blockHighRiskTrades: true, allowSwapWhenSignalExpired: true, policyAdmin: PUBLISHER,
    });
    const execution = executor.propose({
      actions: [{ type: "swap", poolId: POOL_ID, tokenIn: WETH, tokenOut: USDC, amountIn: 1000000000000000000n, direction: "sell", maxSlippageBps: 50 }],
      confirmationRequired: true,
    });
    const results = await executor.confirm(execution.id);
    expect(results[0]!.status).toBe("rejected");
    expect(results[0]!.error).toContain("blocked");
  });

  it("cancels pending execution", () => {
    const execution = executor.propose({
      actions: [{ type: "wait", reason: "test", durationMs: 1000 }],
      confirmationRequired: true,
    });
    executor.cancel(execution.id);
    expect(executor.getPending()).toHaveLength(0);
    expect(executor.getHistory()).toHaveLength(1);
    expect(executor.getHistory()[0]!.status).toBe("cancelled");
  });

  it("throws on confirm of unknown execution", async () => {
    await expect(executor.confirm("nonexistent")).rejects.toThrow("not found");
  });

  it("executes wait and alert actions as success", async () => {
    const execution = executor.propose({
      actions: [
        { type: "wait", reason: "test", durationMs: 1000 },
        { type: "alert", level: "info", message: "test alert" },
      ],
      confirmationRequired: true,
    });
    const results = await executor.confirm(execution.id);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.status === "success")).toBe(true);
  });

  it("executes hedge action with ratio", async () => {
    const execution = executor.propose({
      actions: [{ type: "hedge", poolId: POOL_ID, tokenIn: WETH, tokenOut: USDC, amountIn: 2000000000000000000n, hedgeRatio: 0.5 }],
      confirmationRequired: true,
    });
    const results = await executor.confirm(execution.id);
    expect(results[0]!.status).toBe("success");
    expect(writer.approveToken).toHaveBeenCalled();
  });

  it("stops execution on first failure", async () => {
    (writer.approveToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("insufficient funds"));
    const execution = executor.propose({
      actions: [
        { type: "swap", poolId: POOL_ID, tokenIn: WETH, tokenOut: USDC, amountIn: 1000000000000000000n, direction: "sell", maxSlippageBps: 50 },
        { type: "wait", reason: "should not reach", durationMs: 1000 },
      ],
      confirmationRequired: true,
    });
    const results = await executor.confirm(execution.id);
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("failed");
    expect(results[0]!.error).toContain("insufficient funds");
  });

  it("getPending returns only unconfirmed executions", () => {
    executor.propose({ actions: [{ type: "wait", reason: "a", durationMs: 1000 }], confirmationRequired: true });
    executor.propose({ actions: [{ type: "wait", reason: "b", durationMs: 1000 }], confirmationRequired: true });
    expect(executor.getPending()).toHaveLength(2);
  });
});
