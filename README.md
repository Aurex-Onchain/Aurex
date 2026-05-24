# Aurex

Open Signal Marketplace Protocol on Uniswap V4 Hooks + Self-hosted AI Trading Application.

Built on X Layer Mainnet (Chain ID: 196).

---

## What is Aurex

Aurex is two things:

**1. An open signal marketplace protocol** — permissionless on-chain infrastructure where anyone can publish market intelligence signals. Signal quality is enforced by economics: publishers stake AUREX tokens as collateral, accurate signals earn fee revenue, bad signals get slashed.

**2. Aurex Advisor** — a self-hosted AI trading application that completes the full execution loop:

```
Onchain Data → AI Intelligence → Risk Analysis → Strategy Generation → Signal Publishing → Wallet Execution
```

The protocol is shared infrastructure. The Advisor is the recommended way to use it — a self-hosted MCP Server application that automatically fetches signals, reasons over market context, publishes its own signals, monitors user behavior for risk anomalies, and executes through Hook-enforced pools.

AI clients (OpenClaw, Cursor, Hermes, Claude, etc.) connect to the user's Advisor via plugin.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                       Aurex Ecosystem                            │
│                                                                  │
│  ┌───────────────────────┐    ┌──────────────────────────────┐  │
│  │  Signal Protocol       │    │  Aurex Advisor               │  │
│  │  (Open Infrastructure) │    │  (Self-hosted AI App)        │  │
│  │                        │    │                              │  │
│  │  - SignalRegistry      │◄──►│  Auto fetch + push signals   │  │
│  │  - AlphaHook           │    │  AI intelligence + execution │  │
│  │  - PolicyManager       │    │  Behavior risk indicator     │  │
│  │  - PoolFactory         │    │  MCP Server for AI clients   │  │
│  │  - Stake/Slash         │    │  Push notifications          │  │
│  │                        │    │                              │  │
│  │  Anyone can publish    │    │  Aurex's flagship product    │  │
│  └───────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### For Signal Publishers (AI Agent Operators)

You run an AI that analyzes on-chain data — whale movements, liquidity shifts, volume anomalies. You want to monetize your alpha.

1. Stake ≥100 AUREX → register as publisher
2. Your AI publishes signals to SignalRegistry (risk score, alpha score, recommended fee)
3. Pool creators whitelist your address → your signals drive dynamic fees on their pools
4. Every swap through those pools → you earn a share of the fee (publisherShareBps)
5. Your accuracy is tracked on-chain. High accuracy → more pools adopt you → more revenue

```
Your AI → publishes signal → pool uses it → swap happens → you earn fee share
                                                              ↓
                                              wrong signal → 10% stake slashed
```

### For Pool Creators (LP Managers)

You provide liquidity and want dynamic fee protection based on market conditions.

1. Call `PoolFactory.createPool()` with your token pair and policy parameters
2. Set publisher whitelist — choose which signal publishers you trust
3. Swaps through your pool now have dynamic fees driven by real-time signals
4. High-risk signal → higher fee (protects LPs). Low-risk → lower fee (attracts volume)
5. You configure `publisherShareBps` — how much of the fee goes to the signal publisher

### For Traders

Standard Uniswap V4 swap experience with added intelligence:

- Dynamic fees reflect real-time market risk (transparent before swap)
- High-risk blocking protects you from adverse conditions
- No additional interaction required — just swap

### For Advisor Users (AI-Native Trading)

You want an AI trading assistant that works across your existing AI tools.

1. Deploy Advisor locally (Docker / npm)
2. Advisor auto-registers as publisher, starts fetching on-chain data
3. Connect your AI client (OpenClaw, Cursor, Hermes) via plugin
4. Ask questions: "What's the risk on ETH right now?" → Advisor responds with full context
5. Advisor pushes alerts: "Whale moved 500 ETH to exchange, suggest reducing exposure"
6. Confirm execution → Advisor swaps through Hook pool → earns fee revenue as publisher
7. Behavior indicator warns if you're trading abnormally: "Your trade frequency is 4x your 30-day average"

---

## Token Economics

### AUREX = Signal Quality Bond

AUREX is a staking quality bond. Its function is economic collateral that guarantees signal quality.

```
Publisher stakes AUREX → publishes signal → signal drives dynamic fee on pool
     ↑                                                              |
     └──── accurate → accuracy score ↑, more pools adopt ←─────────┘
     └──── inaccurate → 10% stake slashed, accuracy score ↓ ←──────┘
                                                                    |
     publisher earns fee revenue share from every swap ←────────────┘
```

### Mechanisms

| Mechanism | How It Works | Effect |
|-----------|-------------|--------|
| Stake-to-Publish | Stake ≥100 AUREX to register as publisher | Permission to publish signals |
| Slash on Bad Signal | Wrong prediction → 10% of stake burned | Makes manipulation expensive |
| Accuracy Score | On-chain track record (0-100, starts at 50) | Public reputation |
| Fee Revenue Share | Hook takes `publisherShareBps` from swap output → credits publisher | Accuracy = income |
| Publisher Whitelist | Pool admins choose which publishers to trust | Curated quality |

### Publisher Economics

Revenue comes from **real swap fees**, not token inflation:

```
Publisher publishes signal for Pool X
  → Trader swaps through Pool X
    → Hook applies dynamic fee based on signal
      → Hook takes publisherShareBps (e.g. 5%) from swap output
        → Credits to publisher's claimable balance
          → Publisher claims accumulated revenue
```

**Cost structure:**

| Cost | Amount | When |
|------|--------|------|
| Initial stake | ≥100 AUREX | Registration (one-time, recoverable after cooldown) |
| Gas per signal | ~0.001 OKB | Each publishSignal() call |
| Slash risk | 10% of stake | Per wrong prediction |

**Sustainable flywheel:**
- Better signals → more pools whitelist you → more swap volume → more revenue
- Bad signals → slash → lower accuracy → pools remove you → no revenue

### No Hard Boundary Between User and Publisher

Any user can become a publisher by staking. With Advisor, this happens automatically — the Advisor registers as publisher on behalf of the user and manages the full lifecycle.

---

## On-chain Protocol

### Architecture

```
Layer 1 — On-chain Protocol (Shared Infrastructure)
  └─ AurexAlphaHook + SignalRegistry + PolicyManager + PoolFactory
  └─ Permissionless: anyone can create pools, publish signals, verify accuracy

Layer 2 — Signal Marketplace (Open Competition)
  └─ Publishers stake AUREX → publish signals → accuracy tracked on-chain
  └─ Bad signals → slash; Good signals → higher accuracy + more revenue
  └─ Pool creators choose which publishers to trust (whitelist)
```

### Contracts (X Layer Mainnet)

| Contract | Address | Role |
|----------|---------|------|
| AurexSignalRegistry | `0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f` | Publisher lifecycle + signal storage + verification |
| AurexAlphaHook | `0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0` | Dynamic fee + revenue share (Uniswap V4 Hook) |
| AurexPolicyManager | `0x025774B4e49b7Cb98D90111461B69Af98c301cD7` | Pool policy configuration |
| AurexPoolFactory | `0x6708213b47715771e290e41599de14e45E8C4358` | Permissionless pool creation |
| PoolManager (Uniswap V4) | `0x360e68faccca8ca495c1b759fd9eee466db9fb32` | Core Uniswap V4 |
| MockAUREX | `0x8819A7972e17C61A4eeFe0F06e4bbef521228c82` | Stake token |

### Protocol Flow

```
1. Publisher stakes AUREX → registerPublisher() → active publisher
2. Pool creator calls PoolFactory.createPool() → new Hook pool with policy
3. Pool admin sets publisher whitelist (optional, curates signal sources)
4. Publisher publishes signal → SignalRegistry stores it with timestamp + price snapshot
5. Trader swaps → Hook.beforeSwap() reads latest signal → computes dynamic fee
6. Hook.afterSwap() takes publisherShareBps from swap output → credits publisher
7. Signal expires → anyone calls verifySignal() → compares predicted vs actual price
8. Accurate → accuracy score +5; Wrong → 10% stake slashed, accuracy -5
9. Publisher claims accumulated fee revenue
```

### Signal Structure

Each signal contains:

| Field | Type | Description |
|-------|------|-------------|
| signalId | bytes32 | Unique identifier |
| poolId | bytes32 | Target pool |
| riskScore | uint256 | Market risk assessment (0-100) |
| alphaScore | uint256 | Alpha opportunity score (0-100) |
| liquidityScore | uint256 | Liquidity health (0-100) |
| volatilityScore | uint256 | Volatility level (0-100) |
| recommendedFee | uint24 | Publisher's suggested fee (bps) |
| expiresAt | uint64 | Signal expiry timestamp |
| signer | address | Publisher address |

### Dynamic Fee Computation

```
If signal has recommendedFee within [defaultFee, maxFee]:
  fee = recommendedFee

Otherwise:
  fee = defaultFee + (maxFee - defaultFee) × riskScore / 100
```

Example: defaultFee=3000, maxFee=10000, riskScore=42
→ fee = 3000 + 7000 × 42/100 = 5940 bps

### Signal Verification

After a signal expires, anyone can trigger verification:

1. Compare `priceAtPublish` (slot0 when signal was published) vs `priceAtExpiry` (slot0 at verification time)
2. If `alphaScore > 50` → publisher predicted price increase
3. If actual price decreased significantly → signal was wrong → slash
4. If prediction aligned with reality → accuracy score increases

### Pool Policy

Each pool has configurable parameters:

| Parameter | Description | Range |
|-----------|-------------|-------|
| maxRiskScore | Block swaps if signal risk exceeds this | 0-100 |
| minLiquidityScore | Block if liquidity too low | 0-100 |
| defaultFee | Base fee when risk is 0 | bps |
| maxFee | Maximum fee at risk=100 | bps |
| publisherShareBps | Publisher's cut of swap output | 0-5000 (0-50%) |
| blockHighRiskTrades | Whether to revert high-risk swaps | bool |
| allowSwapWhenSignalExpired | Allow swaps with no active signal | bool |

---

## Aurex Advisor

### Overview

A self-hosted AI trading application. Users deploy it locally — their keys, their data, their AI. The Advisor serves both an MCP interface (for AI clients) and an HTTP API (for the web dashboard). No separate backend service needed.

```
┌─────────────┐  ┌─────────┐  ┌────────┐  ┌────────┐
│ OpenClaw    │  │ Cursor  │  │ Hermes │  │ Claude │
│ (plugin)    │  │ (plugin)│  │(plugin)│  │ (MCP)  │
└──────┬──────┘  └────┬────┘  └───┬────┘  └───┬────┘
       └───────────────┴──────────┴────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Aurex Advisor (MCP Server)    │
              │  Self-hosted by user           │
              │                               │
              │  Auto fetch signals + data     │
              │  AI strategy generation        │
              │  Auto publish signals          │
              │  Behavior risk monitoring      │
              │  Wallet execution              │
              │  HTTP API for Dashboard        │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Aurex Signal Protocol (chain) │
              └───────────────────────────────┘
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `advisor.market_status` | Current market overview + active signals + risk state |
| `advisor.get_strategy` | AI-generated strategy with simulation and alternatives |
| `advisor.execute` | Confirm and execute strategy via wallet |
| `advisor.risk_check` | Portfolio risk analysis + behavior indicator status |
| `advisor.behavior_alert` | Current behavioral anomaly warnings |
| `advisor.publish_signal` | Manually trigger signal publication |
| `advisor.configure` | Set risk preferences, behavior thresholds |
| `advisor.publisher_stats` | Publishing accuracy + revenue stats |

### Behavior Risk Indicator

Monitors trading patterns and warns against impulsive decisions:

| Metric | Alert Condition |
|--------|----------------|
| Daily trade frequency | > 3x your 30-day average |
| Single trade size | > 1.5x your historical max |
| Position concentration | Sudden jump to >80% single asset |
| Consecutive same-direction | Exceeds historical max streak |
| Daily cumulative loss | > configured % of portfolio |

Alerts do NOT block execution. They push warnings through connected AI clients and request explicit confirmation.

### Strategy Generation

The Advisor uses a flexible action set — no hardcoded logic. The LLM reasons freely over full context (user holdings, active signals, on-chain data, publisher rankings, pool state) and generates personalized strategies.

Available action categories:
- **Trading**: swap, limitSwap, splitSwap
- **Liquidity**: addLiquidity, removeLiquidity, migrateLiquidity
- **Wait**: wait, waitForFee, waitForSignal
- **Risk**: setAlert, stopLoss, hedge, diversify
- **Information**: explain, compare, simulate, followPublisher
- **Revenue**: claimFees, becomePublisher, increaseStake

Every recommendation includes: reasoning chain, confidence score, simulation (before/after portfolio), and at least one alternative strategy with tradeoff explanation.

Full action schema: [`docs/ADVISOR_ACTIONS.md`](./docs/ADVISOR_ACTIONS.md)

---

## Third-party Agent Integration

The protocol is open. Any AI agent can connect via MCP or SDK:

```typescript
import { AurexSDK } from "@aurex/sdk";

const aurex = new AurexSDK({ rpcUrl, privateKey });

// Register as publisher
await aurex.publisher.register(stakeAmount);

// Publish signal
await aurex.signals.publish({
  poolId,
  riskScore: 42,
  alphaScore: 81,
  liquidityScore: 70,
  volatilityScore: 30,
  recommendedFee: 5000,
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
});

// Claim revenue
await aurex.publisher.claimRevenue(tokenAddress);
```

| | Aurex Advisor | Third-party Agent |
|--|--------------|-------------------|
| Configuration | Out-of-box | Manual MCP/SDK setup |
| Fetch signals | Automatic | Manual API calls |
| Push signals | Automatic | Manual API calls |
| Behavior indicator | Built-in | Not included |
| Notifications | Built-in (via AI clients) | Self-implemented |
| Wallet execution | Built-in | Self-implemented |

---

## Project Structure

```
aurex/
  apps/
    advisor/          — Aurex Advisor (self-hosted MCP Server)
    web/              — Web dashboard (optional)

  contracts/
    src/
      hooks/          — AurexAlphaHook.sol (dynamic fee + revenue share)
      registry/       — AurexSignalRegistry.sol (publisher lifecycle + signals)
      policy/         — AurexPolicyManager.sol (pool policy config)
      factory/        — AurexPoolFactory.sol (permissionless pool creation)
      tokens/         — MockAUREX.sol, MockUSDC.sol
      interfaces/     — IAurexSignalRegistry.sol, IAurexPolicyManager.sol
      libraries/      — AurexTypes.sol, FeeMath.sol
    test/
    script/
    deployments/

  packages/
    aurex-sdk/        — TypeScript SDK for contract interactions
    shared-types/     — Shared TypeScript types

  plugins/
    openclaw/         — OpenClaw plugin adapter
    cursor/           — Cursor plugin adapter
    hermes/           — Hermes plugin adapter

  docs/
    AUREX_ARCHITECTURE_WHITEPAPER.md
    ROADMAP.md
    ADVISOR_ACTIONS.md
    DESIGN_DECISIONS.md
```

---

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Foundry (forge, cast, anvil)

### Build Contracts

```bash
cd contracts
forge build
```

### Run Tests

```bash
cd contracts
forge test
```

34 tests covering:
- Publisher registration, unregistration, cooldown
- Signal publishing, expiry, verification
- Slash mechanism (wrong prediction → 10% stake slashed)
- Publisher whitelist enforcement
- Dynamic fee computation (low risk, high risk, recommended)
- Revenue share (credits publisher, zero when no signal, zero when shareBps=0)
- Policy CRUD, version tracking, authorization
- PoolFactory permissionless creation

### Deploy

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC --broadcast
```

---

## Live Pools (X Layer Mainnet)

| Pool | Token0 | Token1 | Active Signal |
|------|--------|--------|--------------|
| WETH/USDC | WETH | USDC | riskScore=42, alphaScore=81 |
| USDC/WBTC | USDC | WBTC | riskScore=28, alphaScore=55 |
| USDT/WETH | USDT | WETH | riskScore=72, alphaScore=35 |
| USDC/WOKB | USDC | WOKB | riskScore=30, alphaScore=78 |

---

## Documentation

- [Architecture Whitepaper](./docs/AUREX_ARCHITECTURE_WHITEPAPER.md) — Full protocol + Advisor specification
- [Development Roadmap](./docs/ROADMAP.md) — Phase definitions and priority matrix
- [Advisor Actions](./docs/ADVISOR_ACTIONS.md) — Complete action schema and context format
- [Design Decisions](./docs/DESIGN_DECISIONS.md) — Undecided items for future phases

---

## Security Model

**Economic Security:**
- Minimum stake (100 AUREX) prevents spam
- 10% slash per bad signal makes manipulation expensive
- Accuracy score is public and immutable on-chain

**Contract Security:**
- Hook fails safely when signal is expired (uses defaultFee)
- Dynamic fee bounded by policy.maxFee
- publisherShareBps capped at 50%
- No unbounded loops in hook execution

**Advisor Security:**
- Self-hosted: user's keys never leave their machine
- No centralized service has access to user's wallet
- Behavior history stored in local SQLite only
- User must confirm every execution (no auto-execute without consent)

---

## License

MIT
