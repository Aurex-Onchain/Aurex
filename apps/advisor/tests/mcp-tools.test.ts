import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMcpServer, type McpDeps } from "../src/mcp/index.js";
import { assembleStrategy } from "../src/mcp/strategy.js";
import { createBehaviorMonitor } from "../src/behavior/index.js";
import { defaultConfig } from "../src/config.js";
import type { ChainReader } from "../src/chain/reader.js";
import type { ChainWriter } from "../src/chain/writer.js";

const PUBLISHER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`;
const POOL_ID = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

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
    registerPublisher: vi.fn(),
    increaseStake: vi.fn(),
    unregisterPublisher: vi.fn(),
    publishSignal: vi.fn().mockResolvedValue("0xabc" as `0x${string}`),
    verifySignal: vi.fn(),
    claimFees: vi.fn(),
    approveToken: vi.fn(),
  };
}

function createDeps(overrides?: Partial<McpDeps>): McpDeps {
  return {
    reader: createMockReader(),
    writer: createMockWriter(),
    store: null as never,
    loop: null,
    behavior: createBehaviorMonitor(defaultConfig.behavior),
    executor: null,
    aggregator: null,
    config: { ...defaultConfig },
    poolIds: [POOL_ID],
    ...overrides,
  };
}

describe("MCP Server", () => {
  it("creates MCP server without error", () => {
    const deps = createDeps();
    const server = createMcpServer(deps);
    expect(server).toBeDefined();
  });
});

describe("assembleStrategy", () => {
  let deps: McpDeps;

  beforeEach(() => {
    deps = createDeps();
  });

  it("returns market status with pools and publishers", async () => {
    const ctx = await assembleStrategy(deps);
    expect(ctx.market.pools).toHaveLength(1);
    expect(ctx.market.pools[0]!.poolId).toBe(POOL_ID);
    expect(ctx.market.publishers).toHaveLength(1);
    expect(ctx.market.publishers[0]!.address).toBe(PUBLISHER);
    expect(ctx.timestamp).toBeTypeOf("number");
  });

  it("returns null userState when no address provided", async () => {
    const ctx = await assembleStrategy(deps);
    expect(ctx.userState).toBeNull();
  });

  it("returns userState when address provided", async () => {
    const ctx = await assembleStrategy(deps, PUBLISHER);
    expect(ctx.userState).not.toBeNull();
    expect(ctx.userState!.address).toBe(PUBLISHER);
    expect(ctx.userState!.balances).toHaveLength(1);
    expect(ctx.userState!.balances[0]!.symbol).toBe("AUREX");
  });

  it("includes behavior status", async () => {
    const ctx = await assembleStrategy(deps);
    expect(ctx.behaviorStatus.level).toBe("normal");
    expect(ctx.behaviorStatus.alerts).toHaveLength(0);
  });

  it("reflects behavior alerts after risky trades", async () => {
    deps.behavior.recordTrade({ timestamp: Date.now(), direction: "buy", sizePercent: 50, asset: "ETH", pnlPercent: 0 });
    const ctx = await assembleStrategy(deps);
    expect(ctx.behaviorStatus.level).not.toBe("normal");
  });

  it("includes pool signal and price data", async () => {
    const ctx = await assembleStrategy(deps);
    const pool = ctx.market.pools[0]!;
    expect(pool.latestSignal).not.toBeNull();
    expect(pool.latestSignal!.riskScore).toBe(42n);
    expect(pool.signalValid).toBe(true);
    expect(pool.sqrtPriceX96).toBe(79228162514264337593543950336n);
  });

  it("includes publisher info in userState", async () => {
    const ctx = await assembleStrategy(deps, PUBLISHER);
    expect(ctx.userState!.publisherInfo).not.toBeNull();
    expect(ctx.userState!.publisherInfo!.active).toBe(true);
    expect(ctx.userState!.publisherInfo!.accuracyScore).toBe(72n);
  });

  it("handles reader errors gracefully", async () => {
    (deps.reader.getPoolPolicy as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("fail"));
    (deps.reader.getLatestSignal as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("fail"));
    const ctx = await assembleStrategy(deps);
    expect(ctx.market.pools[0]!.policy).toBeNull();
    expect(ctx.market.pools[0]!.latestSignal).toBeNull();
  });
});
