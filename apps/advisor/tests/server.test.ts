import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer } from "../src/server/index.js";
import { defaultConfig } from "../src/config.js";
import { createBehaviorMonitor } from "../src/behavior/index.js";
import type { McpDeps } from "../src/mcp/index.js";
import type { ChainReader } from "../src/chain/reader.js";

function createMockReader(): ChainReader {
  return {
    getLatestSignal: vi.fn().mockRejectedValue(new Error("no signal")),
    getSignalsByPool: vi.fn().mockResolvedValue([]),
    isSignalValid: vi.fn().mockResolvedValue(false),
    getSignalCount: vi.fn().mockResolvedValue(0n),
    getPublisherInfo: vi.fn().mockResolvedValue({
      stakeAmount: 0n, signalCount: 0n, accuracyScore: 0n, slashCount: 0n, registeredAt: 0n, active: false,
    }),
    getPublisherCount: vi.fn().mockResolvedValue(0n),
    getPublisherList: vi.fn().mockResolvedValue([]),
    getPoolPolicy: vi.fn().mockRejectedValue(new Error("no policy")),
    hasPolicy: vi.fn().mockResolvedValue(false),
    getSlot0Price: vi.fn().mockResolvedValue(0n),
    getClaimable: vi.fn().mockResolvedValue(0n),
    getTokenBalance: vi.fn().mockResolvedValue(0n),
    getTokenSymbol: vi.fn().mockResolvedValue("AUREX"),
  };
}

describe("Advisor HTTP Server", () => {
  let app: Awaited<ReturnType<typeof createServer>>;
  let deps: McpDeps;

  beforeAll(async () => {
    deps = {
      reader: createMockReader(),
      writer: null,
      store: null as never,
      loop: null,
      behavior: createBehaviorMonitor(defaultConfig.behavior),
      executor: null,
      aggregator: null,
      config: { ...defaultConfig },
      poolIds: [],
    };
    app = await createServer(deps);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
    expect(body.timestamp).toBeTypeOf("number");
  });

  it("GET /api/market returns market status structure", async () => {
    const res = await app.inject({ method: "GET", url: "/api/market" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("pools");
    expect(body).toHaveProperty("timestamp");
    expect(Array.isArray(body.pools)).toBe(true);
  });

  it("GET /api/strategy returns strategy context structure", async () => {
    const res = await app.inject({ method: "GET", url: "/api/strategy" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("market");
    expect(body).toHaveProperty("userState");
    expect(body).toHaveProperty("behaviorStatus");
    expect(body.behaviorStatus.level).toBe("normal");
  });

  it("GET /api/publisher returns null when no writer", async () => {
    const res = await app.inject({ method: "GET", url: "/api/publisher" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.address).toBeNull();
  });

  it("GET /api/behavior returns behavior status", async () => {
    const res = await app.inject({ method: "GET", url: "/api/behavior" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.level).toBe("normal");
    expect(body.alerts).toEqual([]);
  });

  it("POST /api/configure updates config", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/configure",
      payload: { score_threshold: 20 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(deps.config.publisher.scoreChangeThreshold).toBe(20);
  });

  it("POST /api/behavior/record records a trade", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/behavior/record",
      payload: { trade: { direction: "buy", sizePercent: 10, asset: "ETH", pnlPercent: 2 } },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.recorded).toBe(true);
    expect(body.status.level).toBe("normal");
  });
});
