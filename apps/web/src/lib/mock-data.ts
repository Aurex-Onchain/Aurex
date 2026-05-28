/**
 * Mock data layer — used in Vercel demo mode when no Advisor backend is reachable.
 *
 * Important: This data is for UI showcase only. It mixes real on-chain values
 * (contract addresses, pool IDs, actual publisher address from v3 deployment)
 * with simulated dynamic data (live signals, scores, behavior alerts).
 *
 * Real values:
 * - Pool IDs (4 pools on X Layer Mainnet)
 * - Publisher address (0x253a...62f, the real v3 publisher)
 * - Contract addresses
 *
 * Simulated values:
 * - Signal scores (riskScore, alphaScore, etc.)
 * - Behavior alerts
 * - Claimable revenue
 * - Message feed
 */

import type {
  MarketResponse,
  PoolStatusResponse,
  PublisherResponse,
  BehaviorResponse,
  HealthResponse,
  AdvisorConfigResponse,
  StrategyResponse,
} from "@/types/api";

const REAL_PUBLISHER = "0x253a399B2A63b400f1e7f06f83Fbcc0F1236f62f";
const REAL_AUREX_TOKEN = "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82";

const REAL_POOLS = [
  { id: "0xa42ef95993739b4b4fa31f493b8e6fe2ecfdaa946a9eda3cf820d641e247bcb1", name: "WETH/USDC" },
  { id: "0x8f902fdacc92a4a7b9c6d373a1a2692748d761b68fe9a2c9372b0713636923db", name: "USDC/WBTC" },
  { id: "0x5a9e74da2155ebb698b778fedaba2ef54e40b0e415e81be96682827851700eff", name: "USDT/WETH" },
  { id: "0xb192334b574994b2e7aea853242032a86efb5af60938d97bdbc57908e1f1d838", name: "USDC/WOKB" },
] as const;

const SIGNAL_PROFILES = [
  { risk: 42, alpha: 81, liquidity: 90, volatility: 55, fee: 2000 },
  { risk: 28, alpha: 55, liquidity: 95, volatility: 30, fee: 1500 },
  { risk: 72, alpha: 35, liquidity: 60, volatility: 85, fee: 7500 },
  { risk: 30, alpha: 78, liquidity: 70, volatility: 40, fee: 2000 },
];

function jitter(base: number, amount = 5): number {
  return Math.max(0, Math.min(100, Math.round(base + (Math.random() - 0.5) * 2 * amount)));
}

function generateMockPool(idx: number): PoolStatusResponse {
  const pool = REAL_POOLS[idx];
  const profile = SIGNAL_PROFILES[idx];
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 60 * 60 + idx * 600;

  const signalId = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join("")}`;

  return {
    poolId: pool.id,
    policy: {
      maxRiskScore: "80",
      minLiquidityScore: "20",
      defaultFee: 3000,
      maxFee: 10000,
      publisherShareBps: 500,
      blockHighRiskTrades: true,
      allowSwapWhenSignalExpired: true,
      policyAdmin: REAL_PUBLISHER,
    },
    latestSignal: {
      signalId,
      poolId: pool.id,
      riskScore: jitter(profile.risk).toString(),
      alphaScore: jitter(profile.alpha).toString(),
      liquidityScore: jitter(profile.liquidity, 3).toString(),
      volatilityScore: jitter(profile.volatility, 8).toString(),
      recommendedFee: profile.fee,
      expiresAt: expiresAt.toString(),
      signer: REAL_PUBLISHER,
    },
    signalValid: true,
    sqrtPriceX96: "0",
    verified: null,
    slashed: null,
  };
}

export function getMockMarket(): MarketResponse {
  return {
    pools: REAL_POOLS.map((_, i) => generateMockPool(i)),
    timestamp: Date.now(),
  };
}

export function getMockPublisher(): PublisherResponse {
  return {
    address: REAL_PUBLISHER,
    info: {
      stakeAmount: "100000000000000000000",
      signalCount: "12",
      accuracyScore: "67",
      slashCount: "0",
      registeredAt: "1779546937",
      active: true,
    },
    claimable: "245890000000000000",
  };
}

export function getMockBehavior(): BehaviorResponse {
  return {
    level: "normal",
    alerts: [],
  };
}

export function getMockHealth(): HealthResponse {
  return {
    status: "ok",
    timestamp: Date.now(),
    version: "0.1.0-demo",
    loop: true,
    publisher: REAL_PUBLISHER,
  };
}

export function getMockConfig(): AdvisorConfigResponse {
  return {
    scoreChangeThreshold: 10,
    intervalMs: 300_000,
    poolIds: REAL_POOLS.map((p) => p.id),
    hotTokens: [
      "0x5A77f1443D16ee5761d310e38b62f77f726bC71c",
      "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
      "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1",
      "0x1E4a5963aBFD975d8c9021ce480b42188849D41d",
      REAL_AUREX_TOKEN,
    ],
    publisherAddress: REAL_PUBLISHER,
    hasPrivateKey: false,
    hasSigner: true,
    signer: { provider: "onchainos", teeBacked: true },
  };
}

export function getMockStrategy(): StrategyResponse {
  const market = getMockMarket();
  return {
    market: {
      pools: market.pools,
      publishers: [
        {
          address: REAL_PUBLISHER,
          info: getMockPublisher().info!,
        },
        {
          address: "0xa1b2c3d4e5f60718293a4b5c6d7e8f9001020304",
          info: {
            stakeAmount: "500000000000000000000",
            signalCount: "47",
            accuracyScore: "82",
            slashCount: "2",
            registeredAt: "1778000000",
            active: true,
          },
        },
        {
          address: "0x9876543210abcdef9876543210abcdef98765432",
          info: {
            stakeAmount: "200000000000000000000",
            signalCount: "23",
            accuracyScore: "71",
            slashCount: "1",
            registeredAt: "1778500000",
            active: true,
          },
        },
      ],
      timestamp: Date.now(),
    },
    userState: null,
    behaviorStatus: getMockBehavior(),
    onchainData: {
      whaleMovementCount: 7,
      liquidityChangeCount: 12,
      volumeAnomalies: [
        { poolId: REAL_POOLS[2].id, ratio: 3.4 },
      ],
      priceDeviations: [
        { token: "0x5A77f1443D16ee5761d310e38b62f77f726bC71c", maxDeviationBps: 82 },
      ],
    },
    timestamp: Date.now(),
  };
}

export interface MockMessage {
  id: string;
  type: "recommendation" | "signal_alert" | "chat" | "strategy" | "system";
  role: "assistant" | "user";
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: number;
}

export function getMockMessages(): { messages: MockMessage[] } {
  const now = Date.now();
  return {
    messages: [
      {
        id: "msg-1",
        type: "strategy",
        role: "assistant",
        content: "Initial market scan complete. 4 pools monitored. Average risk: 43/100. 2 high-alpha opportunities detected (WETH/USDC, USDC/WOKB).",
        metadata: { initialScan: true },
        createdAt: now - 1000 * 60 * 60,
      },
      {
        id: "msg-2",
        type: "signal_alert",
        role: "assistant",
        content: "New signal published for WETH/USDC — Risk 42, Alpha 81. Recommended fee 0.20%. Signal expires in 2h.",
        metadata: {
          pool_id: REAL_POOLS[0].id,
          metrics: [
            { label: "Risk", value: 42, min: 0, max: 100 },
            { label: "Alpha", value: 81, min: 0, max: 100 },
            { label: "Liquidity", value: 90, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 45,
      },
      {
        id: "msg-3",
        type: "recommendation",
        role: "assistant",
        content: "ETH showing breakout pattern. Consider increasing WETH exposure by 15% via WETH/USDC pool. Dynamic fee is favorable (0.20% vs default 0.30%).",
        metadata: {
          pool_id: REAL_POOLS[0].id,
          direction: "buy",
          token_in: "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
          token_out: "0x5A77f1443D16ee5761d310e38b62f77f726bC71c",
          amount: "500000000",
        },
        createdAt: now - 1000 * 60 * 30,
      },
      {
        id: "msg-4",
        type: "signal_alert",
        role: "assistant",
        content: "High-risk signal detected on USDT/WETH (Risk 72, Volatility 85). Hook will apply elevated fee 0.75% to protect LPs. Consider waiting for risk to subside.",
        metadata: {
          pool_id: REAL_POOLS[2].id,
          metrics: [
            { label: "Risk", value: 72, min: 0, max: 100 },
            { label: "Volatility", value: 85, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 20,
      },
      {
        id: "msg-5",
        type: "system",
        role: "assistant",
        content: "Publisher revenue earned: 0.246 AUREX from 4 swaps through your signals. Use claimFees() to collect.",
        metadata: { revenue: "245890000000000000" },
        createdAt: now - 1000 * 60 * 10,
      },
      {
        id: "msg-6",
        type: "recommendation",
        role: "assistant",
        content: "OKB ecosystem showing growth momentum. USDC/WOKB pool has Alpha 78, Risk 30. Good entry zone with low slippage protection.",
        metadata: {
          pool_id: REAL_POOLS[3].id,
          direction: "buy",
          metrics: [
            { label: "Alpha", value: 78, min: 0, max: 100 },
            { label: "Risk", value: 30, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 5,
      },
    ],
  };
}

export function getMockPrices() {
  const now = Date.now();
  return {
    prices: [
      {
        token: "0x5A77f1443D16ee5761d310e38b62f77f726bC71c",
        symbol: "WETH",
        currentUsd: 3245.67,
        priceChange1h: 1.23,
        priceChange24h: 4.56,
        volatility1h: 0.8,
        updatedAt: now,
      },
      {
        token: "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
        symbol: "USDC",
        currentUsd: 1.0001,
        priceChange1h: 0.01,
        priceChange24h: -0.02,
        volatility1h: 0.05,
        updatedAt: now,
      },
      {
        token: "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1",
        symbol: "WBTC",
        currentUsd: 96780.45,
        priceChange1h: -0.5,
        priceChange24h: 2.1,
        volatility1h: 1.2,
        updatedAt: now,
      },
      {
        token: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d",
        symbol: "USDT",
        currentUsd: 0.9998,
        priceChange1h: -0.01,
        priceChange24h: 0.0,
        volatility1h: 0.03,
        updatedAt: now,
      },
      {
        token: "0xe538905cf8410324e03A5A23C1c177a474D59b2b",
        symbol: "WOKB",
        currentUsd: 45.32,
        priceChange1h: 2.4,
        priceChange24h: 8.7,
        volatility1h: 1.8,
        updatedAt: now,
      },
      {
        token: REAL_AUREX_TOKEN,
        symbol: "AUREX",
        currentUsd: 0.42,
        priceChange1h: 5.6,
        priceChange24h: 12.4,
        volatility1h: 3.1,
        updatedAt: now,
      },
    ],
    timestamp: now,
  };
}
