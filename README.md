# Aurex

**English** · [简体中文](./README.zh-CN.md)

Open Signal Marketplace Protocol on Uniswap V4 Hooks + Self-hosted AI Trading Application.

Built on X Layer Mainnet (Chain ID: 196).

> 🏆 **Hook the Future Hackathon submission** — Live on **X Layer Mainnet (Chain 196)** · All 4 core contracts + 2 tokens **verified on Sourcify** · AurexAlphaHook: [`0xF8F9...00c4`](https://www.okx.com/web3/explorer/xlayer/address/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4) · Project X: [@0xAurex_ai](https://twitter.com/0xAurex_ai)
>
> **One-line pitch:** Aurex turns Uniswap V4 Hooks into an open signal marketplace on X Layer — publishers stake AUREX to push on-chain risk/alpha scores, the Hook converts every swap into a dynamic-fee + publisher revenue-share event, and a self-hosted MCP Advisor lets any AI client (Claude / Cursor / OpenClaw) consume and publish signals from one wallet.

## 🎬 Demo Video

https://github.com/user-attachments/assets/2b5f6cd1-f1cf-4530-9952-6c627d8a81d3

## For Hackathon Judges

**60-second verification path:**

1. **Hook is live on X Layer Mainnet** → AurexAlphaHook [`0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4`](https://www.okx.com/web3/explorer/xlayer/address/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4) ([source verified on Sourcify ✓](https://repo.sourcify.dev/196/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4))
2. **Hook has been triggered by real on-chain flow** → 8+ signals published across 4 pools, every tx hash in [`contracts/deployments/demo-transactions.md`](./contracts/deployments/demo-transactions.md)
3. **Hook source code** → [`contracts/src/hooks/AurexAlphaHook.sol`](./contracts/src/hooks/AurexAlphaHook.sol) — `beforeSwap` reads the active signal to compute a dynamic fee; `afterSwap` uses `afterSwapReturnDelta: true` to skim `publisherShareBps` from swap output and credit the publisher in the same tx
4. **Reproduce end-to-end** → `cd contracts && ./run-demo.sh` (uses `script/FullFlowDemo.s.sol` — register publisher → publish 4 signals → all on chain)
5. **Demo video** → embedded above ([script source](./docs/VIDEO_SCRIPT.md))

**Mapped to the three evaluation criteria:**

| Criterion | Aurex's answer |
|-----------|----------------|
| **Innovation** | Hook is not a business plugin — it's the **settlement layer of a signal marketplace**. Publishers stake AUREX → push signals → the Hook reads them at `beforeSwap` to set dynamic fee → at `afterSwap` it routes `publisherShareBps` back to the publisher via `afterSwapReturnDelta`. Alpha becomes a tradeable, slashable, on-chain asset class — something V4 Hooks make possible for the first time. |
| **Market value** | Publisher revenue comes from **real swap fees**, not token inflation — every swap through a Hook pool credits the publisher in the same transaction. Sustainable cash flow for any AI agent that can produce accurate market intelligence, plus dynamic-fee LP protection for pool creators. |
| **Completeness** | 4 core contracts + 2 tokens deployed on X Layer Mainnet · all verified on Sourcify · 34 passing Foundry tests · 8+ live signals across 4 pools · end-to-end demo reproducible by judges in one command |

---

🌐 **Live Demo (Showcase only)**: [web-sigma-virid-60.vercel.app](https://web-sigma-virid-60.vercel.app)

> ⚠️ **The hosted demo is for preview purposes only.** Aurex Advisor is designed to be **self-hosted** — every user runs their own instance with their own keys, their own data, and their own AI client. The Vercel deployment exists only to showcase the UI; for real usage, follow the [Self-host Guide](#self-host-guide) below.

📜 **On-chain transactions**: [contracts/deployments/demo-transactions.md](./contracts/deployments/demo-transactions.md) — 8+ signals published on X Layer

🔌 **Deep integration with OKX ExchangeOS**: Aurex Advisor connects natively to OKX OnchainOS Agentic Wallet for TEE-backed signing, transaction security scanning, and seamless on-chain execution. See [OnchainOS Integration](#onchainos-agentic-wallet-signer) below.

---

## Self-host Guide

Aurex's design principle: **your keys, your data, your AI**. Nothing should be trusted to a centralized service.

```bash
# 1. Clone and install
git clone https://github.com/Aurex-Onchain/Aurex.git
cd Aurex
pnpm install

# 2. Run the Advisor (self-hosted backend)
cd apps/advisor
cp .env.example .env
# Configure AUREX_PRIVATE_KEY or AUREX_SIGNER_PROVIDER=onchainos
pnpm dev          # Runs on http://localhost:3100

# 3. Run the Web Dashboard (your local UI)
cd ../web
pnpm dev          # Runs on http://localhost:3000

# 4. Connect any AI client (Claude Code, Cursor, etc.) via MCP
# See: docs/AI_CLIENT_INTEGRATION.md
```

The `vercel.app` demo is a static UI shell — it cannot publish signals, sign transactions, or hold any keys. Only your locally-running Advisor instance can do those things.

---

## What is Aurex

Aurex is two things:

**1. An open signal marketplace protocol** — permissionless on-chain infrastructure where anyone can publish market intelligence signals. Signal quality is enforced by economics: publishers stake AUREX tokens as collateral, accurate signals earn fee revenue, bad signals get slashed.

**2. Aurex Advisor** — a self-hosted AI trading application that completes the full execution loop:

```
Onchain Data → Algorithmic Scoring → Strategy Generation (AI client) → Signal Publishing → Wallet Execution
                                          ↕
              AI Client (OpenClaw/Cursor/Claude) reasons over Advisor's structured context
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

All 6 contracts are **verified on Sourcify** (chain 196). Click verification badges to view source code:

| Contract | Address | Verified | Source |
|----------|---------|----------|--------|
| AurexSignalRegistry | [`0xE00f...7D45`](https://www.okx.com/web3/explorer/xlayer/address/0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45) | [✓ Sourcify (full)](https://repo.sourcify.dev/196/0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45) | [contracts/src/registry/](./contracts/src/registry/AurexSignalRegistry.sol) |
| AurexAlphaHook | [`0xF8F9...00c4`](https://www.okx.com/web3/explorer/xlayer/address/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4) | [✓ Sourcify (full)](https://repo.sourcify.dev/196/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4) | [contracts/src/hooks/](./contracts/src/hooks/AurexAlphaHook.sol) |
| AurexPolicyManager | [`0xEe55...3E5F`](https://www.okx.com/web3/explorer/xlayer/address/0xEe55CF595586527d5ADE7065CD2766899b123E5F) | [✓ Sourcify (full)](https://repo.sourcify.dev/196/0xEe55CF595586527d5ADE7065CD2766899b123E5F) | [contracts/src/policy/](./contracts/src/policy/AurexPolicyManager.sol) |
| AurexPoolFactory | [`0xD44c...8A40`](https://www.okx.com/web3/explorer/xlayer/address/0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40) | [✓ Sourcify (full)](https://repo.sourcify.dev/196/0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40) | [contracts/src/factory/](./contracts/src/factory/AurexPoolFactory.sol) |
| PoolManager (Uniswap V4) | [`0x360e...fb32`](https://www.okx.com/web3/explorer/xlayer/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32) | (external) | [v4-core](https://github.com/Uniswap/v4-core) |
| MockAUREX | [`0x8819...8c82`](https://www.okx.com/web3/explorer/xlayer/address/0x8819A7972e17C61A4eeFe0F06e4bbef521228c82) | [✓ Sourcify (partial)](https://repo.sourcify.dev/196/0x8819A7972e17C61A4eeFe0F06e4bbef521228c82) | [contracts/src/tokens/](./contracts/src/tokens/MockAUREX.sol) |
| MockUSDC | [`0x4229...231d`](https://www.okx.com/web3/explorer/xlayer/address/0x4229Df8c78F60D1Daf54035E01527B9B025C231d) | [✓ Sourcify (partial)](https://repo.sourcify.dev/196/0x4229Df8c78F60D1Daf54035E01527B9B025C231d) | [contracts/src/tokens/](./contracts/src/tokens/MockUSDC.sol) |

**To verify yourself:** `cd contracts && ./verify-sourcify.sh`

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
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Claude Code  │  │ Cursor       │  │ Windsurf     │  │ Cline        │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │                 │
┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐
│ Continue.dev │  │ Zed Editor   │  │ Claude App   │  │ OpenClaw     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       └──────────────────┴──────────────────┴──────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────────────┐
              │  Aurex Advisor (MCP Server)                   │
              │  Self-hosted by user                          │
              │                                               │
              │  Auto fetch signals + data                    │
              │  Algorithmic signal scoring                   │
              │  Structured context for AI                    │
              │  Behavior risk monitoring                     │
              │  Wallet execution                             │
              │  HTTP API for Dashboard                       │
              └───────────────────┬───────────────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────────────┐
              │  Aurex Signal Protocol (chain)                │
              └───────────────────────────────────────────────┘
```

### Supported AI Clients

Aurex Advisor works with **9+ AI assistants** via MCP (Model Context Protocol):

| Client | Type | Transport | Description |
|--------|------|-----------|-------------|
| **Claude Code** | CLI | stdio | Anthropic's official CLI for Claude |
| **Cursor** | IDE | stdio | AI-first code editor |
| **Windsurf** | IDE | stdio | Codeium's AI IDE |
| **Cline** | Extension | stdio | VSCode AI assistant |
| **Continue.dev** | Extension | stdio | Open-source AI code assistant |
| **Zed** | Editor | stdio | High-performance code editor |
| **Claude Desktop** | App | stdio | Claude desktop application |
| **OpenClaw** | Platform | http | AI agent platform with plugins |
| **Hermes AI** | Platform | sse | AI assistant with SSE support |

**Setup**: Visit the Advisor page in the web dashboard to get client-specific configuration for your preferred AI assistant.

### MCP Tools

| Tool | Description |
|------|-------------|
| `advisor.market_status` | Current market overview + active signals + risk state |
| `advisor.get_strategy` | Structured market context + algorithmic analysis for AI client to reason over |
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

The Advisor uses a flexible action set — no hardcoded logic. The AI client's LLM (OpenClaw, Cursor, Claude, etc.) calls `advisor.get_strategy` to receive structured market context, then reasons freely over it to generate personalized strategies. The Advisor itself does not run an LLM — it provides algorithmic signal scoring and structured data; the intelligence layer lives in whatever AI client the user connects.

Available action categories:
- **Trading**: swap, limitSwap, splitSwap
- **Liquidity**: addLiquidity, removeLiquidity, migrateLiquidity
- **Wait**: wait, waitForFee, waitForSignal
- **Risk**: setAlert, stopLoss, hedge, diversify
- **Information**: explain, compare, simulate, followPublisher
- **Revenue**: claimFees, becomePublisher, increaseStake

Every recommendation includes: reasoning chain, confidence score, simulation (before/after portfolio), and at least one alternative strategy with tradeoff explanation.

Full action schema: [`docs/ADVISOR_ACTIONS.md`](./docs/ADVISOR_ACTIONS.md)

### OnchainOS Agentic Wallet Signer

Advisor can publish signals and submit contract calls through OKX OnchainOS Agentic Wallet. In this mode, private-key generation, custody, and signing happen inside OnchainOS' TEE-backed wallet instead of `AUREX_PRIVATE_KEY`.

```bash
cd apps/advisor
cp .env.example .env

# Install and log in to the OnchainOS CLI first:
curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/main/install.sh | sh
onchainos wallet login

# Then set:
AUREX_SIGNER_PROVIDER=onchainos
AUREX_ONCHAINOS_CHAIN=196
# Optional if Advisor should not auto-resolve it from `onchainos wallet balance`:
AUREX_ONCHAINOS_ADDRESS=0x...
```

When `AUREX_SIGNER_PROVIDER=onchainos`, Advisor encodes Aurex contract calls locally, runs an OnchainOS transaction security scan, then calls `onchainos wallet contract-call` for TEE signing and broadcasting. Keep `AUREX_ONCHAINOS_AUTO_CONFIRM=false` unless the operator has explicitly accepted the confirmation policy for unattended publishing.

### Deep Integration with OKX ExchangeOS

Aurex is designed to integrate natively with the **OKX ExchangeOS** ecosystem — not as a separate silo, but as a first-class participant in OnchainOS' agent + wallet stack:

| ExchangeOS Capability | How Aurex Uses It |
|------------------------|-------------------|
| **OnchainOS Agentic Wallet** | TEE-backed signer for publishing signals, claiming revenue, executing swaps. No private keys touch user disk. |
| **Transaction Security Scan** | Every Aurex contract call passes through `onchainos security tx-scan` before signing — phishing, malicious approvals, and risky calldata are blocked. |
| **OKX DEX Aggregator** | Future: route Hook-pool swaps through OKX DEX for best execution across X Layer DEXes. |
| **OKX Wallet Portfolio** | Future: pull user balance + DeFi positions from OKX OnchainOS into Advisor's `risk_check` for full-picture portfolio analysis. |
| **OKX X Layer** | Native deployment chain — protocol contracts already live on Chain ID 196. |
| **OKX Skills System** | Aurex Advisor exposes itself as an MCP tool server, ready to be invoked by any OKX OnchainOS skill or agent. |

**Why this matters:** ExchangeOS provides a secure execution substrate (TEE wallet + security scanning + aggregated liquidity). Aurex provides the intelligence layer on top (signal marketplace + behavior monitoring + AI strategy generation). The combination gives users a fully-AI-native trading experience without ever exposing keys, leaking data, or trusting a centralized service.

**Roadmap:**
- [x] Phase 1: TEE signing via OnchainOS Agentic Wallet
- [x] Phase 2: Transaction security scan integration
- [ ] Phase 3: OKX DEX swap routing for non-Hook pools
- [ ] Phase 4: OnchainOS skill registration so other OKX agents can call Aurex tools
- [ ] Phase 5: Cross-chain signal publishing via OKX bridge aggregator


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
