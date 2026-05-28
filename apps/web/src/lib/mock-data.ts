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
    level: "info",
    alerts: [
      {
        metric: "trade_frequency",
        current: 2.1,
        threshold: 3.0,
        level: "info",
        message: "Trade frequency 2.1× your 30-day average (within normal range, but trending up)",
      },
      {
        metric: "single_trade_size",
        current: 0.85,
        threshold: 1.5,
        level: "info",
        message: "Largest recent trade was 85% of your historical max — within healthy bounds",
      },
      {
        metric: "position_concentration",
        current: 62,
        threshold: 70,
        level: "info",
        message: "WETH concentration at 62% of portfolio (threshold 70%). Consider diversification",
      },
      {
        metric: "consecutive_direction",
        current: 3,
        threshold: 5,
        level: "info",
        message: "3 consecutive buy trades — within normal streak length",
      },
      {
        metric: "daily_pnl",
        current: -2.3,
        threshold: -15,
        level: "info",
        message: "Today's PnL: -2.3% (well within -15% daily loss threshold)",
      },
      {
        metric: "velocity_of_change",
        current: 12,
        threshold: 30,
        level: "info",
        message: "Portfolio composition changing 12% per 24h (normal range)",
      },
    ],
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
        content: "Initial market scan complete. Monitoring 4 Hook pools + 10 tokens. Average risk: 43/100. 2 high-alpha opportunities (WETH/USDC, USDC/WOKB). 2 high-volatility tokens flagged (PEPE -8.3%, BONK -12.4%).",
        metadata: { initialScan: true },
        createdAt: now - 1000 * 60 * 90,
      },
      {
        id: "msg-2",
        type: "signal_alert",
        role: "assistant",
        content: "New signal published for WETH/USDC — Risk 42, Alpha 81. Hook will apply 0.20% dynamic fee. Signal expires in 2h.",
        metadata: {
          pool_id: REAL_POOLS[0].id,
          metrics: [
            { label: "Risk", value: 42, min: 0, max: 100 },
            { label: "Alpha", value: 81, min: 0, max: 100 },
            { label: "Liquidity", value: 90, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 75,
      },
      {
        id: "msg-3",
        type: "recommendation",
        role: "assistant",
        content: "BONK dropped -31.6% in 24h with volatility 7.8%. Risk indicator: HIGH. Recommend converting BONK position to USDT to preserve capital. Historical pattern: similar drops in May/Aug saw further -15% before reversal.",
        metadata: {
          direction: "sell",
          token_in: "0x0000000000000000000000000000000000000004",
          token_out: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d",
          rationale: "risk_off",
          metrics: [
            { label: "24h Change", value: -31.6, min: -50, max: 50 },
            { label: "Volatility", value: 78, min: 0, max: 100 },
            { label: "Risk Level", value: 92, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 65,
      },
      {
        id: "msg-4",
        type: "recommendation",
        role: "assistant",
        content: "Historical analysis: WBTC has bounced from $96k support 3 times in past 30 days. Current price $96,780 — within 0.3% of historical entry zone. Suggest accumulating via USDC/WBTC pool with Hook protection (Risk 28).",
        metadata: {
          pool_id: REAL_POOLS[1].id,
          direction: "buy",
          token_in: "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
          token_out: "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1",
          amount: "1000000000",
          rationale: "historical_pattern",
          metrics: [
            { label: "Pool Risk", value: 28, min: 0, max: 100 },
            { label: "Alpha", value: 55, min: 0, max: 100 },
            { label: "Confidence", value: 73, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 55,
      },
      {
        id: "msg-5",
        type: "signal_alert",
        role: "assistant",
        content: "PEPE -22.7% in 24h. Volatility breakout detected. Memecoin reversion risk extreme. If you hold PEPE, consider partial exit (50%) into USDC.",
        metadata: {
          metrics: [
            { label: "24h Change", value: -22.7, min: -50, max: 50 },
            { label: "Volatility", value: 54, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 48,
      },
      {
        id: "msg-6",
        type: "recommendation",
        role: "assistant",
        content: "ETH breakout pattern confirmed (1h +1.23%, 24h +4.56%). 3 of 4 historical setups led to +8-12% follow-through within 48h. Increase WETH allocation by 15% via WETH/USDC. Hook fee favorable: 0.20% vs default 0.30%.",
        metadata: {
          pool_id: REAL_POOLS[0].id,
          direction: "buy",
          token_in: "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
          token_out: "0x5A77f1443D16ee5761d310e38b62f77f726bC71c",
          amount: "500000000",
          rationale: "breakout_continuation",
          metrics: [
            { label: "Setup Match", value: 75, min: 0, max: 100 },
            { label: "Pool Alpha", value: 81, min: 0, max: 100 },
            { label: "Risk", value: 42, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 40,
      },
      {
        id: "msg-7",
        type: "signal_alert",
        role: "assistant",
        content: "High-risk signal on USDT/WETH (Risk 72, Volatility 85). Hook will apply elevated fee 0.75% to protect LPs. Whale movement detected: 380 ETH moved to centralized exchange in last block. Consider waiting.",
        metadata: {
          pool_id: REAL_POOLS[2].id,
          metrics: [
            { label: "Risk", value: 72, min: 0, max: 100 },
            { label: "Volatility", value: 85, min: 0, max: 100 },
            { label: "Whale Pressure", value: 65, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 32,
      },
      {
        id: "msg-8",
        type: "strategy",
        role: "assistant",
        content: "Behavior monitor flagged: your trade frequency is 2.1x your 30-day average. Within normal threshold (3x), but trending up. Suggest reviewing positions before next trade to avoid impulsive sizing.",
        metadata: {
          alertType: "behavior_warning",
          metrics: [
            { label: "Frequency Ratio", value: 70, min: 0, max: 100 },
            { label: "Threshold", value: 100, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 25,
      },
      {
        id: "msg-9",
        type: "recommendation",
        role: "assistant",
        content: "OKB ecosystem signal strong: WOKB +8.7% 24h, USDC/WOKB pool Alpha 78, Risk 30. Historical 30-day correlation with X Layer activity = 0.84. Recommend accumulating WOKB with low slippage protection.",
        metadata: {
          pool_id: REAL_POOLS[3].id,
          direction: "buy",
          token_in: "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
          token_out: "0xe538905cf8410324e03A5A23C1c177a474D59b2b",
          rationale: "ecosystem_growth",
          metrics: [
            { label: "Alpha", value: 78, min: 0, max: 100 },
            { label: "Risk", value: 30, min: 0, max: 100 },
            { label: "Correlation", value: 84, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 18,
      },
      {
        id: "msg-10",
        type: "recommendation",
        role: "assistant",
        content: "Portfolio rebalance suggestion: your concentration in WETH is at 62% (threshold 70%). Diversifying into stable assets (USDT/USDC) at this point reduces drawdown risk by ~18% based on 6-month volatility data.",
        metadata: {
          rationale: "concentration_management",
          metrics: [
            { label: "Concentration", value: 62, min: 0, max: 100 },
            { label: "Threshold", value: 70, min: 0, max: 100 },
            { label: "Drawdown Reduction", value: 18, min: 0, max: 50 },
          ],
        },
        createdAt: now - 1000 * 60 * 12,
      },
      {
        id: "msg-11",
        type: "system",
        role: "assistant",
        content: "Publisher revenue earned: 0.246 AUREX from 4 swaps through your signals (WETH/USDC × 3, USDC/WOKB × 1). Use claimFees() to collect. Accuracy score now 67/100.",
        metadata: { revenue: "245890000000000000" },
        createdAt: now - 1000 * 60 * 8,
      },
      {
        id: "msg-12",
        type: "recommendation",
        role: "assistant",
        content: "DOGE +18.3% 24h on news momentum. However: short-term overbought (volatility 4.2%, +6.1% in 1h alone). Historical setup: 4 of 5 similar 24h pumps had >12% pullback within 48h. Suggest taking profits if holding.",
        metadata: {
          direction: "sell",
          token_in: "0x0000000000000000000000000000000000000002",
          token_out: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d",
          rationale: "overbought_exit",
          metrics: [
            { label: "24h Change", value: 18.3, min: -50, max: 50 },
            { label: "Overbought", value: 80, min: 0, max: 100 },
            { label: "Pattern Match", value: 80, min: 0, max: 100 },
          ],
        },
        createdAt: now - 1000 * 60 * 4,
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
        currentPrice: 3245.67,
        change1hPct: 1.23,
        change24hPct: 4.56,
        volatility1h: 0.8,
        updatedAt: now,
      },
      {
        token: "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
        symbol: "USDC",
        currentPrice: 1.0001,
        change1hPct: 0.01,
        change24hPct: -0.02,
        volatility1h: 0.05,
        updatedAt: now,
      },
      {
        token: "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1",
        symbol: "WBTC",
        currentPrice: 96780.45,
        change1hPct: -0.5,
        change24hPct: 2.1,
        volatility1h: 1.2,
        updatedAt: now,
      },
      {
        token: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d",
        symbol: "USDT",
        currentPrice: 0.9998,
        change1hPct: -0.01,
        change24hPct: 0.0,
        volatility1h: 0.03,
        updatedAt: now,
      },
      {
        token: "0xe538905cf8410324e03A5A23C1c177a474D59b2b",
        symbol: "WOKB",
        currentPrice: 45.32,
        change1hPct: 2.4,
        change24hPct: 8.7,
        volatility1h: 1.8,
        updatedAt: now,
      },
      // AUREX has no demo USD quote; omitting it prevents mock pricing from
      // inflating wallet portfolio value in hosted/demo mode.
      {
        token: "0x0000000000000000000000000000000000000001",
        symbol: "PEPE",
        currentPrice: 0.0000084,
        change1hPct: -8.3,
        change24hPct: -22.7,
        volatility1h: 5.4,
        updatedAt: now,
      },
      {
        token: "0x0000000000000000000000000000000000000002",
        symbol: "DOGE",
        currentPrice: 0.34,
        change1hPct: 6.1,
        change24hPct: 18.3,
        volatility1h: 4.2,
        updatedAt: now,
      },
      {
        token: "0x0000000000000000000000000000000000000003",
        symbol: "SOL",
        currentPrice: 218.45,
        change1hPct: 0.9,
        change24hPct: 3.2,
        volatility1h: 1.5,
        updatedAt: now,
      },
      {
        token: "0x0000000000000000000000000000000000000004",
        symbol: "BONK",
        currentPrice: 0.000027,
        change1hPct: -12.4,
        change24hPct: -31.6,
        volatility1h: 7.8,
        updatedAt: now,
      },
    ],
    timestamp: now,
  };
}
