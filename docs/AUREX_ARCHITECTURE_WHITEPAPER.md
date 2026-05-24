# Aurex Protocol Whitepaper

**Version:** 1.1  
**Status:** Architecture specification aligned with deployed contracts  
**Network:** X Layer Mainnet (Chain ID: 196)  
**Core Protocol:** Uniswap V4 Hooks

---

## 1. Executive Summary

Aurex is two things:

1. **An open signal marketplace protocol** — permissionless on-chain infrastructure where anyone can publish market intelligence signals, with quality enforced by economic incentives (stake + slash + fee revenue share).

2. **Aurex Advisor** — a user self-hosted AI-native trading application that completes the full execution loop:

```
Onchain Data → AI Intelligence → Risk Analysis → Strategy Generation → Signal Publishing → Wallet Execution
```

The protocol provides shared infrastructure. The Advisor is the recommended way to use it — a self-hosted application that automatically fetches signals from the marketplace, reasons over market context, generates and publishes trading strategies, monitors user behavior for risk anomalies, and executes through Hook-enforced pools.

AI clients (OpenClaw, Cursor, Hermes, etc.) connect to the user's Advisor via plugin, making it accessible from any AI workflow. The Advisor pushes alerts and recommendations through these channels, and users interact with it through the same channels.

```
┌─────────────────────────────────────────────────────────────────┐
│                       Aurex Ecosystem                             │
│                                                                   │
│  ┌───────────────────────┐    ┌───────────────────────────────┐  │
│  │  Signal Protocol       │    │  Aurex Advisor                │  │
│  │  (Open Infrastructure) │    │  (Self-hosted AI App)         │  │
│  │                        │    │                               │  │
│  │  - SignalRegistry      │◄──►│  Auto fetch + push signals    │  │
│  │  - AlphaHook           │    │  AI intelligence + execution  │  │
│  │  - PolicyManager       │    │  Behavior risk indicator      │  │
│  │  - PoolFactory         │    │  MCP Server for AI clients    │  │
│  │  - Stake/Slash         │    │  Push notifications           │  │
│  │                        │    │                               │  │
│  │  Anyone can publish    │    │  Aurex's flagship product     │  │
│  └───────────────────────┘    └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Product Positioning

### 2.1 Two Core Products

**Product 1: Aurex Signal Protocol**

An open, permissionless signal marketplace where:
- Signal quality is enforced by economics (stake + slash), not gatekeeping
- Revenue comes from real swap fees, not token inflation
- Anyone can participate as publisher, pool creator, or trader
- Third-party AI agents integrate through MCP/SDK (manual configuration)

**Product 2: Aurex Advisor (Self-hosted AI Trading App)**

A user-deployed application that:
- Automatically fetches signals from the marketplace and on-chain data
- Uses LLM intelligence to analyze market conditions and generate strategies
- Automatically publishes signals back to the protocol (Advisor is itself a publisher)
- Monitors user behavior patterns and warns against risk anomalies (anti-all-in)
- Executes through Aurex Hook pools with wallet signing
- Exposes itself as an MCP Server — AI clients connect via plugin
- Pushes alerts and recommendations through connected AI client channels

### 2.2 How They Relate

```
Signal Protocol = open infrastructure (anyone can build on it)
Aurex Advisor  = the flagship app built on it (self-hosted, auto fetch+push)
Third-party AI = can also connect (manual MCP/SDK configuration)
```

### 2.3 Advisor Access Model

The Advisor is not a web service hosted by Aurex. It is a self-hosted application that users deploy locally or on their own infrastructure. AI clients connect to it:

```
┌─────────────┐  ┌─────────┐  ┌────────┐  ┌─────────┐  ┌────────┐
│ OpenClaw    │  │ Cursor  │  │ Hermes │  │ Claude  │  │ Web UI │
│ (plugin)    │  │ (plugin)│  │(plugin)│  │ (MCP)  │  │(direct)│
└──────┬──────┘  └────┬────┘  └───┬────┘  └───┬────┘  └───┬────┘
       └───────────────┴──────────┴────────────┴───────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │  Aurex Advisor (MCP Server)    │
                  │  User self-hosted              │
                  │                               │
                  │  ← AI clients connect here    │
                  │  → pushes alerts to clients   │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │  Aurex Signal Protocol (chain) │
                  │  auto fetch + auto push        │
                  └───────────────────────────────┘
```

### 2.4 Core Differentiation

| vs. | Aurex Difference |
|-----|-----------------|
| Numerai | Revenue from real swap fees, not token inflation. Full execution loop. |
| 3Commas / copy-trading | AI-native, self-hosted. On-chain signal verification. Behavior risk monitoring. |
| ChatGPT + DeFi | Self-hosted app with wallet execution. Not just chat — publishes signals, earns revenue. |
| Oracle networks (Chainlink) | Signals are market intelligence, not price feeds. Open marketplace. |
| DeFi analytics (Nansen) | Signals are executable. Advisor acts on them and publishes its own. |

---

## 3. Architecture Overview

### 3.1 Protocol Layers

```
Layer 1 — On-chain Protocol (Shared Infrastructure)
  └─ AurexAlphaHook + AurexSignalRegistry + AurexPolicyManager + AurexPoolFactory
  └─ Permissionless: anyone can create pools, publish signals, verify accuracy

Layer 2 — Signal Marketplace (Open Competition)
  └─ Publishers stake AUREX → publish signals → accuracy tracked on-chain
  └─ Bad signals → automatic slash; Good signals → higher accuracy score
  └─ Pool creators choose which publishers' signals to trust (whitelist)
  └─ Fee revenue share: accurate publishers earn from swap fees

Layer 3 — Aurex Advisor (Self-hosted AI Trading App)
  └─ The recommended way to use Aurex
  └─ Auto fetch: reads signals, on-chain data, user state
  └─ AI intelligence: LLM reasons over full context → strategy generation
  └─ Auto push: publishes signals to SignalRegistry (Advisor is a publisher)
  └─ Behavior indicator: monitors user patterns, warns against risk anomalies
  └─ Wallet execution: user confirms → execute through Hook pools
  └─ MCP Server: AI clients (OpenClaw/Cursor/Hermes) connect via plugin
  └─ Push notifications: alerts and recommendations through AI client channels

Layer 4 — Third-party Agent Integration (Manual Configuration)
  └─ Any AI can connect to Aurex protocol via MCP/SDK
  └─ Requires manual setup (vs Advisor's out-of-box experience)
  └─ Same capabilities: fetch signals, publish signals, claim revenue
  └─ No built-in behavior indicator or notification system
```

### 3.2 System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AI Clients (User's Interface)                     │
│  ┌──────────┐  ┌─────────┐  ┌────────┐  ┌────────┐  ┌──────────┐  │
│  │ OpenClaw │  │ Cursor  │  │ Hermes │  │ Claude │  │  Web UI  │  │
│  │ (plugin) │  │ (plugin)│  │(plugin)│  │ (MCP) │  │ (direct) │  │
│  └────┬─────┘  └────┬────┘  └───┬────┘  └───┬────┘  └────┬─────┘  │
└───────┼──────────────┼──────────┼────────────┼────────────┼─────────┘
        └──────────────┴──────────┴────────────┴────────────┘
                                  │ plugin / MCP
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Aurex Advisor (Self-hosted MCP Server)                   │
│                                                                       │
│  ┌─ Tools ──────────────────────────────────────────────────────┐   │
│  │ advisor.market_status    — current market + signal overview    │   │
│  │ advisor.get_strategy     — AI-generated strategy + simulation │   │
│  │ advisor.execute          — confirm and execute via wallet      │   │
│  │ advisor.risk_check       — portfolio risk analysis             │   │
│  │ advisor.behavior_alert   — behavioral anomaly status          │   │
│  │ advisor.publish_signal   — manually trigger signal publish     │   │
│  │ advisor.configure        — set risk preferences, thresholds   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─ Auto Processes ─────────────────────────────────────────────┐   │
│  │ • Fetch: continuously reads signals + on-chain data           │   │
│  │ • Push: auto-publishes signals to SignalRegistry              │   │
│  │ • Monitor: tracks user behavior, compares to history          │   │
│  │ • Alert: pushes warnings through connected AI clients         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     X Layer Mainnet                                   │
│                                                                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │ Uniswap V4      │  │ AurexSignal      │  │ AurexPolicy       │   │
│  │ PoolManager     │  │ Registry         │  │ Manager           │   │
│  │                 │  │                  │  │                   │   │
│  │ ┌─────────────┐│  │ - publishers[]   │  │ - policies[]      │   │
│  │ │AurexAlpha   ││  │ - signals[]      │  │ - poolId→policy   │   │
│  │ │Hook         ││  │ - accuracy[]     │  │ - publisherShare  │   │
│  │ │             ││  │ - whitelist[]    │  │ - maxFee          │   │
│  │ │ beforeSwap  ││  │                  │  │                   │   │
│  │ │ afterSwap   │◄──┤ getLatestSignal()│  │ getPolicy()       │   │
│  │ │ returnDelta ││  │                  │  │                   │   │
│  │ └─────────────┘│  └──────────────────┘  └───────────────────┘   │
│  └─────────────────┘                                                 │
│                                                                       │
│  ┌─────────────────┐  ┌──────────────────┐                          │
│  │ AurexPool       │  │ AUREX Token      │                          │
│  │ Factory         │  │ (Stake Bond)     │                          │
│  │ createPool()    │  │ stake → publish  │                          │
│  │ permissionless  │  │ slash on wrong   │                          │
│  └─────────────────┘  └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Token Economics: AUREX = Signal Quality Bond

### 4.1 Token Role

AUREX is a **staking quality bond**. Its sole confirmed function is to serve as economic collateral that guarantees signal quality.

| Mechanism | Function | Token Demand |
|-----------|----------|-------------|
| Stake-to-Publish | Publishers stake ≥100 AUREX to register | Staking = permission to publish |
| Slash on Bad Signal | Wrong predictions → 10% stake slashed | Quality guarantee |
| Accuracy Score | On-chain track record (0-100) | Reputation = trust |
| Fee Revenue Share | Hook takes publisherShareBps from swap output | Accuracy = income |
| Publisher Whitelist | Pool admins control which publishers can signal | Curated quality |

### 4.2 Publisher Economics

Publishers earn revenue from **real swap fees**, not token inflation:

```
Publisher publishes signal for Pool X
  → Trader swaps through Pool X
    → Hook applies dynamic fee based on signal
      → Hook takes publisherShareBps (e.g. 5%) from swap output
        → Credits to signal publisher's claimable balance
          → Publisher claims accumulated revenue
```

Revenue source: actual protocol usage (swap volume × fee × publisherShare).

Sustainable flywheel:
- Better signals → more pools whitelist you → more swap volume uses your signal → more revenue
- Bad signals → slash → lower accuracy → pools remove you → no revenue

The Advisor itself is a publisher. When users run Advisor, it stakes AUREX and publishes signals automatically — earning fee revenue that offsets operational costs.

### 4.3 Cost Structure for Publishers

| Cost | Amount | When |
|------|--------|------|
| Initial stake | ≥100 AUREX | Registration (one-time, recoverable) |
| Gas per signal | ~0.001 OKB | Each publishSignal() call |
| Slash risk | 10% of stake | Per wrong prediction |

### 4.4 User = Publisher (No Hard Boundary)

There is no separate "publisher" role. Any user can become a publisher:

```
User (holds AUREX)
  → stakes ≥100 AUREX via registerPublisher()
    → now a Publisher (can publish signals)
      → publishes signals, earns fee share
        → optionally unregisters, gets stake back (after cooldown)
```

With Advisor: this happens automatically. The Advisor registers as publisher on behalf of the user and manages the full lifecycle.

---

## 5. On-chain Protocol (Deployed Contracts)

### 5.1 Contract Addresses (X Layer Mainnet)

| Contract | Address |
|----------|---------|
| PoolManager (Uniswap V4) | `0x360e68faccca8ca495c1b759fd9eee466db9fb32` |
| AurexSignalRegistry | `0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f` |
| AurexPolicyManager | `0x025774B4e49b7Cb98D90111461B69Af98c301cD7` |
| AurexAlphaHook | `0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0` |
| AurexPoolFactory | `0x6708213b47715771e290e41599de14e45E8C4358` |
| MockAUREX (Stake Token) | `0x8819A7972e17C61A4eeFe0F06e4bbef521228c82` |
| MockUSDC | `0x4229Df8c78F60D1Daf54035E01527B9B025C231d` |

### 5.2 AurexSignalRegistry

The registry is the core of the signal marketplace. It manages publisher lifecycle and signal storage.

**Publisher Lifecycle:**

```solidity
struct PublisherInfo {
    uint256 stakeAmount;
    uint256 signalCount;
    uint256 accuracyScore;    // 0-100, starts at 50
    uint256 slashCount;
    uint64 registeredAt;
    bool active;
}
```

**Key Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `registerPublisher(uint256 amount)` | Anyone | Stake AUREX → become publisher |
| `unregisterPublisher()` | Publisher | Exit + reclaim stake (7-day cooldown) |
| `publishSignal(AurexSignal)` | Active publisher | Publish signal for a pool |
| `verifySignal(bytes32 signalId)` | Anyone | Trigger accuracy check after expiry |
| `setPublisherWhitelist(bytes32 poolId, address[])` | Pool admin | Restrict publishers for a pool |
| `getSignalsByPool(bytes32[])` | Anyone (view) | Batch query |
| `getPublisherList()` | Anyone (view) | All registered publishers |

**Signal Structure:**

```solidity
struct AurexSignal {
    bytes32 signalId;
    bytes32 poolId;
    uint256 riskScore;        // 0-100, higher = more risky
    uint256 alphaScore;       // 0-100, higher = more alpha opportunity
    uint256 liquidityScore;   // 0-100, higher = better liquidity
    uint256 volatilityScore;  // 0-100, higher = more volatile
    uint24 recommendedFee;    // publisher's suggested fee (bps)
    uint64 expiresAt;         // signal expiry timestamp
    address signer;           // publisher address
}
```

**Verification & Slash:**

When a signal expires, anyone can call `verifySignal()`:
- Reads `priceAtPublish` (sqrtPriceX96 recorded when signal was published)
- Reads current `slot0` price from PoolManager
- Compares: if alphaScore > 50 (bullish signal) but price dropped > 5% → slash
- Slash: 10% of publisher's stake burned, accuracyScore -= 5
- Correct: accuracyScore += 1 (capped at 100)

### 5.3 AurexAlphaHook

Uniswap V4 Hook that reads signals and applies dynamic fees + revenue share.

**Hook Flags:** `BEFORE_SWAP | AFTER_SWAP | AFTER_SWAP_RETURNS_DELTA`

**beforeSwap:**
1. Read latest signal for this pool from SignalRegistry
2. Read policy from PolicyManager
3. If signal expired and `allowSwapWhenSignalExpired = false` → revert
4. If `riskScore > maxRiskScore` and `blockHighRiskTrades = true` → revert
5. Compute dynamic fee: `defaultFee + (maxFee - defaultFee) * riskScore / 100`
6. If signal has valid `recommendedFee` within bounds → use it instead
7. Return fee override to PoolManager

**afterSwap:**
1. Calculate publisher's revenue share: `outputAmount * publisherShareBps / 10000`
2. Take delta from swap output (using `AFTER_SWAP_RETURNS_DELTA`)
3. Credit to publisher's claimable balance
4. Emit `RevenueShared` event

**Fee Computation:**

```
fee = defaultFee + (maxFee - defaultFee) × riskScore / 100

Example:
  defaultFee = 3000 (0.3%)
  maxFee = 10000 (1%)
  riskScore = 20 → fee = 4400 (0.44%)
  riskScore = 90 → fee = 9300 (0.93%)
```

### 5.4 AurexPolicyManager

Stores per-pool risk policies.

```solidity
struct PoolPolicy {
    uint256 maxRiskScore;
    uint256 minLiquidityScore;
    uint24 defaultFee;
    uint24 maxFee;
    uint16 publisherShareBps;       // max 50%
    bool blockHighRiskTrades;
    bool allowSwapWhenSignalExpired;
    address policyAdmin;
}
```

### 5.5 AurexPoolFactory

Permissionless pool creation:

```solidity
function createPool(
    address token0,
    address token1,
    uint24 tickSpacing,
    PoolPolicy calldata policy
) external returns (bytes32 poolId);
```

### 5.6 Protocol Flow

```
1. Publisher stakes AUREX → registerPublisher() → active publisher
2. Pool creator calls PoolFactory.createPool() → new Hook pool
3. Pool admin sets publisher whitelist (optional)
4. Publisher publishes signal → SignalRegistry stores it
5. Trader swaps → Hook.beforeSwap() reads signal → dynamic fee
6. Hook.afterSwap() takes publisherShareBps → credits publisher
7. Signal expires → verifySignal() → accuracy updated or slashed
8. Publisher claims accumulated fee revenue
```

---

## 6. Signal Marketplace Mechanics

### 6.1 Open Competition Model

- No gatekeeping: anyone with ≥100 AUREX can publish
- Quality emerges from economics: bad publishers get slashed, good ones earn revenue
- Pool admins curate via whitelist
- Reputation is public: accuracyScore, signalCount, slashCount all on-chain

### 6.2 Publisher Incentive Alignment

```
EV = (fee revenue from accurate signals) - (slash cost from bad signals)

Accurate: EV = Σ(pool_volume × fee × publisherShare) per signal period
Inaccurate: EV = -(10% × stake) per bad signal
```

Natural selection: only publishers with genuine alpha survive long-term.

### 6.3 Pool Creator Incentives

- Dynamic fees protect LPs during high-risk periods
- Publisher whitelist curates signal quality
- publisherShareBps configurable (0-50%)

### 6.4 Trader Experience

Standard Uniswap V4 swap interface:
- Dynamic fee transparent (shown before swap)
- High-risk blocking protects from adverse conditions
- No additional interaction required

---

## 7. Aurex Advisor: Self-hosted AI Trading Application

### 7.1 Overview

The Advisor is Aurex's flagship product — a self-hosted application that users deploy locally or on their own infrastructure. It completes the full AI trading loop:

```
Onchain Data → AI Intelligence → Risk Analysis → Strategy Generation
  → Signal Publishing (auto push to chain)
  → Behavior Monitoring (anti-all-in indicator)
  → Wallet Execution → Proof-of-Alpha
```

It is not a hosted service. Users own their Advisor instance, their data, and their keys.

### 7.2 Deployment Model

```
User deploys Advisor (Docker / npm / binary)
  → Advisor registers as publisher (stakes AUREX)
  → Advisor starts auto-fetching on-chain data + signals
  → Advisor starts auto-publishing signals
  → User connects AI clients via plugin (OpenClaw, Cursor, Hermes, etc.)
  → Advisor pushes alerts through connected clients
  → User interacts through any connected client
```

### 7.3 MCP Server Interface

The Advisor exposes itself as an MCP Server. AI clients connect via plugin:

| Tool | Description |
|------|-------------|
| `advisor.market_status` | Current market overview + active signals + risk state |
| `advisor.get_strategy` | AI-generated strategy with simulation |
| `advisor.execute` | Confirm and execute strategy via wallet |
| `advisor.risk_check` | Portfolio risk analysis + behavior indicator status |
| `advisor.behavior_alert` | Current behavioral anomaly warnings |
| `advisor.publish_signal` | Manually trigger signal publication |
| `advisor.configure` | Set risk preferences, behavior thresholds |
| `advisor.publisher_stats` | Advisor's own publishing accuracy + revenue |

### 7.4 Automatic Processes

The Advisor runs continuously in the background:

| Process | Function |
|---------|----------|
| Signal Fetcher | Reads all active signals from SignalRegistry, tracks publisher accuracy |
| On-chain Monitor | Watches whale movements, liquidity changes, volume anomalies |
| Strategy Engine | LLM analyzes context, generates trading strategies |
| Signal Publisher | Auto-publishes signals to SignalRegistry (Advisor is a publisher) |
| Behavior Monitor | Tracks user's trading patterns, compares to historical baseline |
| Alert Dispatcher | Pushes warnings and recommendations through connected AI clients |

### 7.5 Execution Loop

```
1. FETCH (automatic, continuous)
   - Signal marketplace: other publishers' signals, accuracy rankings
   - On-chain data: whale movements, liquidity, volume, liquidations, holder distribution
   - Pool state: TVL, fees, price changes
   - User state: holdings, LP positions, transaction history

2. AI INTELLIGENCE
   - LLM aggregates full context
   - Generates strategy with reasoning chain
   - No hardcoded logic — LLM reasons freely over data

3. RISK ANALYSIS
   - Market risk: signal marketplace riskScores
   - Portfolio risk: exposure, concentration, drawdown simulation
   - Behavior risk: today's actions vs historical patterns (see Section 7.6)

4. STRATEGY + PUBLISH
   - Generate personalized actions from defined action set
   - Simulate before/after portfolio state
   - Auto-publish signal to SignalRegistry
   - Push strategy recommendation to user via AI client

5. EXECUTION (requires user confirmation)
   - User confirms via any connected AI client
   - Wallet signs transaction
   - Swap through Hook pool → dynamic fee applied
   - Proof-of-Alpha recorded on-chain
   - Revenue credited to Advisor's publisher account
```

### 7.6 Behavior Risk Indicator (Anti-All-In)

The Advisor monitors user trading behavior and warns when patterns deviate from historical norms. This prevents impulsive "all-in" decisions.

**Tracked Metrics:**

| Metric | Calculation | Alert Threshold |
|--------|-------------|-----------------|
| Daily trade frequency | Today's trades / 30-day daily average | > 3x average |
| Single trade size | Trade amount / total portfolio | > 1.5x user's historical max |
| Position concentration | Single asset % of portfolio | Sudden jump from <50% to >80% |
| Consecutive same-direction | N consecutive same-direction trades | > historical max streak |
| Daily cumulative loss | Realized + unrealized loss today | > X% of portfolio (configurable) |
| Velocity of change | Portfolio composition change rate | Faster than any prior 24h period |

**Alert Behavior:**

Alerts do NOT block execution. They:
1. Push warning through connected AI clients ("Your trade frequency today is 4x your 30-day average")
2. Flag the strategy recommendation ("Behavior anomaly detected: position concentration would reach 85%")
3. Request explicit confirmation ("You are about to put 80% of your portfolio into a single asset. Confirm?")

**Configuration:**

Users can adjust thresholds via `advisor.configure`:
```json
{
  "behaviorIndicator": {
    "enabled": true,
    "frequencyMultiplier": 3.0,
    "maxSingleTradePercent": 40,
    "maxConcentrationPercent": 70,
    "maxDailyLossPercent": 15,
    "lookbackDays": 30
  }
}
```

### 7.7 Notification & Interaction Channels

The Advisor communicates bidirectionally through connected AI clients:

**Push (Advisor → User):**
- Behavior warnings: "Today's trading frequency is 4x your average"
- Market alerts: "Whale transferred 500 ETH to exchange, your ETH position at risk"
- Strategy recommendations: "Suggest reducing ETH exposure by 30%"
- Revenue notifications: "Your signals earned 0.5 ETH in fees this week"
- Slash warnings: "Your last signal was inaccurate, accuracy dropped to 72"

**Pull (User → Advisor):**
- "What's the current market risk for ETH?"
- "Generate a strategy for my portfolio"
- "Execute the recommended swap"
- "Show my publishing accuracy stats"
- "Why did you publish that signal?"

All interactions happen through whichever AI client the user has connected — no need to open a separate app.

### 7.8 Available Actions

The Advisor generates strategies from a defined action set:

| Category | Actions | Description |
|----------|---------|-------------|
| Trading | swap, limitSwap, splitSwap | Execute trades with risk awareness |
| Liquidity | addLiquidity, removeLiquidity, migrateLiquidity | LP management |
| Wait | wait, waitForFee, waitForSignal | Timing optimization |
| Risk | setAlert, stopLoss, hedge, diversify | Portfolio protection |
| Information | explain, compare, simulate, followPublisher | Market understanding |
| Revenue | claimFees, becomePublisher, increaseStake | Protocol participation |

Full action schema: [`docs/ADVISOR_ACTIONS.md`](./ADVISOR_ACTIONS.md)

### 7.9 Output Format

Every strategy recommendation includes:
- Summary + reasoning chain
- Confidence score + signal sources cited
- Recommended actions with priority
- Simulation (before/after: risk, exposure, drawdown)
- Behavior indicator status (normal / warning / critical)
- At least one alternative strategy with tradeoff explanation

---

## 8. Third-party Agent Integration

### 8.1 Overview

While the Advisor is the recommended way to use Aurex, the protocol is open. Any AI agent can connect via MCP or SDK with manual configuration.

| | Aurex Advisor | Third-party Agent |
|--|--------------|-------------------|
| Deployment | User self-hosts | User self-hosts |
| Configuration | Out-of-box | Manual MCP/SDK setup |
| Fetch signals | Automatic | Manual API calls |
| Push signals | Automatic | Manual API calls |
| Behavior indicator | Built-in | Not included |
| Notifications | Built-in (via AI clients) | Self-implemented |
| Wallet execution | Built-in | Self-implemented |

### 8.2 MCP/SDK Tools for Third-party Agents

```
aurex.get_market_data      — aggregated on-chain metrics
aurex.publish_signal       — sign and publish signal to registry
aurex.get_pool_status      — pool state + active signal
aurex.verify_signal        — trigger signal verification
aurex.claim_revenue        — claim accumulated fee revenue
aurex.get_publisher_stats  — accuracy, stake, revenue
aurex.get_signals          — fetch active signals from marketplace
```

### 8.3 SDK Example

```typescript
import { AurexSDK } from "@aurex/sdk";

const aurex = new AurexSDK({ rpcUrl, privateKey });

await aurex.publisher.register(stakeAmount);

await aurex.signals.publish({
  poolId,
  riskScore: 42,
  alphaScore: 81,
  liquidityScore: 70,
  volatilityScore: 30,
  recommendedFee: 5000,
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
});

await aurex.publisher.claimRevenue(tokenAddress);
```

---

## 9. On-chain Data Sources

Both the Advisor and third-party agents consume:

| Data Type | Source | Purpose |
|-----------|--------|---------|
| Whale wallet movements | Large transfer events (>100 ETH) | Buy/sell pressure |
| Liquidity changes | Pool ModifyLiquidity events | LP confidence |
| Volume anomalies | Swap event aggregation vs historical | Unusual activity |
| Contract state | Lending liquidations, large borrows | Systemic risk |
| Holder distribution | Token holder concentration changes | Dump/accumulation |
| Cross-pool price deviation | Same token across pools | Arbitrage / anomaly |
| Gas fee trends | Network congestion | Execution timing |
| Market narrative | Social sentiment, news | Macro sentiment |

---

## 10. Technical Stack

### 10.1 Contracts

```
Framework: Foundry
Language: Solidity 0.8.26
Target: X Layer Mainnet (Chain ID: 196)
EVM: Cancun
Core dependency: Uniswap V4 (v4-core, v4-periphery)
Optimizer: 200 runs
```

### 10.2 Monorepo Structure

```
aurex/
  apps/
    advisor/      — Aurex Advisor (self-hosted MCP Server app)
    web/          — Web UI (optional dashboard, one of many access channels)

  contracts/
    src/
      hooks/      — AurexAlphaHook.sol
      registry/   — AurexSignalRegistry.sol
      policy/     — AurexPolicyManager.sol
      factory/    — AurexPoolFactory.sol
      tokens/     — MockAUREX.sol, MockUSDC.sol
      interfaces/ — IAurexSignalRegistry.sol, IAurexPolicyManager.sol
      libraries/  — AurexTypes.sol, FeeMath.sol
    test/
    script/
    deployments/

  packages/
    aurex-sdk/            — TypeScript SDK for contract interactions
    shared-types/         — Shared TypeScript types

  plugins/
    openclaw/             — OpenClaw plugin adapter for Advisor
    cursor/               — Cursor plugin adapter for Advisor
    hermes/               — Hermes plugin adapter for Advisor
```

### 10.3 Advisor Stack

```
Runtime: Node.js
Protocol: MCP (Model Context Protocol)
LLM: Claude / GPT (configurable)
Database: SQLite (local behavior history)
Wallet: ethers.js / viem (user's private key, local only)
```

### 10.4 Web UI Stack (Optional)

```
Framework: Next.js
Language: TypeScript
Styling: Tailwind CSS
Wallet: OKX Wallet + wagmi/viem
State: TanStack Query
```

---

## 11. Security Model

### 11.1 Economic Security

- Minimum stake (100 AUREX) prevents spam publishing
- 10% slash per bad signal makes manipulation expensive
- Publisher whitelist allows pool admins to curate quality
- Accuracy score is public and immutable

### 11.2 Contract Security

- Hook fails safely when signal is expired
- Dynamic fee bounded by policy.maxFee
- publisherShareBps capped at 50%
- No unbounded loops in hook execution
- All state changes emit events

### 11.3 Advisor Security

- Self-hosted: user's keys never leave their machine
- No centralized service has access to user's wallet
- Behavior indicator is local-only (trading history stored in local SQLite)
- Advisor's publisher stake is user-controlled
- User must confirm every execution (no auto-execute)

### 11.4 Agent Safety

- Agents publish signals, not execute trades on behalf of others
- Bad signals get slashed automatically
- No agent can bypass Hook policy enforcement
- MCP tools have permission scopes

---

## 12. Development Status & Roadmap

### 12.1 Completed (Phase 1 & 2)

All core contracts deployed and operational on X Layer Mainnet:

| Feature | Status |
|---------|--------|
| Stake-to-Publish | Done |
| Signal Publishing + Expiry | Done |
| Signal Verification (slot0 price) | Done |
| Slash Mechanism | Done |
| Publisher Whitelist | Done |
| Fee Revenue Share (afterSwapReturnDelta) | Done |
| Permissionless Pool Creation (PoolFactory) | Done |
| Batch Queries | Done |
| PoolKey Registration | Done |
| 34 tests passing | Done |

### 12.2 Next Phases

| Phase | Focus | Priority |
|-------|-------|----------|
| Phase 3 | Advisor App — core MCP server + fetch/push + behavior indicator | P0 |
| Phase 4 | Web UI — optional dashboard for signal market browsing | P1 |
| Phase 5 | Plugin Adapters — OpenClaw, Cursor, Hermes integration | P1 |
| Phase 6 | Third-party SDK — aurex-sdk for manual agent integration | P1 |
| Phase 7 | Production hardening | P2 |

Full roadmap: [`docs/ROADMAP.md`](./ROADMAP.md)

---

## 13. Live Pools

| Pool | Token0 | Token1 | Active Signal |
|------|--------|--------|--------------|
| WETH/USDC | WETH | USDC | riskScore=42, alphaScore=81 |
| USDC/WBTC | USDC | WBTC | riskScore=28, alphaScore=55 |
| USDT/WETH | USDT | WETH | riskScore=72, alphaScore=35 |
| USDC/WOKB | USDC | WOKB | riskScore=30, alphaScore=78 |

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| Publisher | Any address that has staked AUREX and registered via SignalRegistry |
| Signal | Structured market intelligence (risk/alpha/liquidity/volatility scores) published on-chain |
| Accuracy Score | On-chain reputation metric (0-100) updated by signal verification |
| Slash | Automatic penalty (10% stake) when signal is verified as inaccurate |
| Hook | Uniswap V4 contract executing custom logic before/after swaps |
| Dynamic Fee | Swap fee varying based on active signal's riskScore |
| Publisher Share | Percentage of swap output credited to signal publisher |
| Pool Admin | Address that created pool via PoolFactory, controls policy and whitelist |
| Advisor | Aurex's self-hosted AI trading app — the full execution loop product |
| Behavior Indicator | Local monitoring system that warns against trading pattern anomalies |
| Proof-of-Alpha | On-chain evidence that a swap was executed under a specific signal |

---

## 15. Conclusion

Aurex combines an open signal marketplace protocol with a self-hosted AI trading application:

- The **protocol** creates a permissionless market where AI agents compete on signal accuracy to earn real swap fee revenue.
- The **Advisor** is the flagship product: a self-hosted app that auto-fetches market data, auto-publishes signals, monitors user behavior, and executes trades — accessible from any AI client via plugin.

For users: deploy Advisor, connect your AI client, get intelligent trading with built-in risk protection.
For builders: connect your AI to the protocol via SDK, publish signals, earn fee revenue.

```
Protocol: accurate signals → fee revenue → sustainable economics
Advisor:  fetch → intelligence → risk check → strategy → publish → execute → proof
```
