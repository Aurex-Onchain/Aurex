# Aurex Development Roadmap

**Protocol**: Open Signal Marketplace on Uniswap V4 Hooks  
**Network**: X Layer Mainnet (Chain ID: 196)

---

## Core Narrative: Open Signal Marketplace + Self-hosted AI Trading App

> 通过实时聚合链上交易、巨鲸钱包行为、流动性变化、合约状态、Holder 分布与市场叙事等 Onchain Signals，构建可执行的 Alpha Intelligence Layer。

> 任何人都可以把自己的 AI 接入 Aurex 协议。你的 AI 越准，你发布的信号被更多池子采用，你赚取更多费率分成。

> Aurex Advisor 是协议的旗舰应用——用户自部署的 AI 交易终端，自动完成从数据采集到策略执行的完整闭环。

### Architecture Layers

```
Layer 1 — On-chain Protocol (Shared Infrastructure)
  └─ AurexAlphaHook + SignalRegistry + PolicyManager + PoolFactory
  └─ Permissionless: anyone can create pools, publish signals, verify accuracy

Layer 2 — Signal Marketplace (Open Competition)
  └─ Publishers stake AUREX → publish signals → accuracy tracked on-chain
  └─ Bad signals → automatic slash; Good signals → higher accuracy score
  └─ Pool creators choose which publishers' signals to trust (whitelist)
  └─ Fee revenue share: accurate publishers earn from swap fees

Layer 3 — Aurex Advisor (Self-hosted AI Trading App)
  └─ Auto fetch: reads signals, on-chain data, user state
  └─ Signal engine: algorithmic scoring from on-chain data (no internal LLM)
  └─ Strategy context: structured data for AI client's LLM to reason over
  └─ Auto push: publishes signals to SignalRegistry (Advisor is a publisher)
  └─ Behavior indicator: monitors user patterns, warns against risk anomalies
  └─ Wallet execution: user confirms → execute through Hook pools
  └─ MCP Server: AI clients (OpenClaw/Cursor/Hermes) connect via plugin

Layer 4 — Third-party Agent Integration (Manual Configuration)
  └─ Any AI can connect to Aurex protocol via MCP/SDK
  └─ Requires manual setup (vs Advisor's out-of-box experience)
  └─ Same capabilities: fetch signals, publish signals, claim revenue
```

### Token Economics: AUREX = Signal Quality Bond

```
Agent analyzes market → generates Signal → publishes on-chain → Hook applies dynamic fee
     ↑                                                                    |
     └──── accurate signals boost reputation; bad signals get slashed ←───┘
                                                                          |
     publisher earns fee revenue share from swaps using their signal ←────┘
```

| Mechanism | Function | Token Demand |
|-----------|----------|-------------|
| Stake-to-Publish | Publishers stake AUREX to register | Staking = permission to publish |
| Slash on Bad Signal | Wrong predictions → 10% stake slashed | Quality guarantee |
| Accuracy Score | On-chain track record (0-100) | Reputation = trust |
| Fee Revenue Share | Hook takes publisher's share from swap output | Accuracy = income |
| Publisher Whitelist | Pool admins control which publishers can signal | Curated quality |

### Protocol Flow

```
1. User's Advisor (or third-party Agent) aggregates on-chain data
2. AI generates Signal → signs → publishes to AurexSignalRegistry
3. Anyone can create a Hook Pool via PoolFactory (permissionless)
4. Pool admin optionally sets publisher whitelist (curated signal sources)
5. Swap triggers Hook → reads latest signal → applies dynamic fee
6. Hook takes publisherShareBps from swap output → credits to signal publisher
7. Signal expires → anyone calls verifySignal → compares predicted vs actual price (from slot0)
8. Accurate → publisher accuracy score increases; Wrong → publisher gets slashed
9. Publisher claims accumulated fee revenue from Hook contract
```

---

## Current Status: Phase 1–4 Complete

Contracts fully implemented with open signal marketplace model. All core mechanisms operational. Revenue share redeployment complete.

### Contract Features Implemented

| Feature | Status | Description |
|---------|--------|-------------|
| Stake-to-Publish | Done | Any address stakes AUREX → becomes publisher |
| Signal Verification | Done | Reads slot0 price at publish + expiry, compares direction |
| Slash Mechanism | Done | Wrong prediction → 10% stake slashed, accuracy -5 |
| Publisher Whitelist | Done | Pool admin restricts which publishers can signal for their pool |
| Fee Revenue Share | Done | Hook takes publisherShareBps from swap output, credits publisher |
| Permissionless Pools | Done | Anyone creates pools via PoolFactory |
| Advisor Mode (Batch Queries) | Done | getSignalsByPool, getPublisherList, isPublisherAllowed |
| PoolKey Registration | Done | PoolFactory auto-registers keys; enables on-chain price reads |

### Test Coverage: 34 tests passing

```
AurexSignalRegistryTest: 17 tests
  - Publisher registration, unregistration, cooldown
  - Signal publishing, expiry validation
  - verifySignal (correct prediction, slash on wrong)
  - Publisher whitelist (set, remove, block unauthorized)
  - PoolKey registration (duplicate, mismatch)
  - Batch queries (getPublisherList, getSignalsByPool)

AurexAlphaHookTest: 9 tests
  - Hook permissions
  - Dynamic fee computation (low risk, high risk, recommended)
  - Signal count tracking, batch signal query
  - Revenue share (credits publisher, zero when no signal, zero when shareBps=0)

AurexPolicyManagerTest: 8 tests
  - Policy CRUD, version tracking
  - Authorization, validation, admin transfer
```

### Deployed Contracts (X Layer Mainnet)

| Contract | Address |
|----------|---------|
| PoolManager (Uniswap V4) | `0x360e68faccca8ca495c1b759fd9eee466db9fb32` |
| AurexSignalRegistry | `0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45` |
| AurexPolicyManager | `0xEe55CF595586527d5ADE7065CD2766899b123E5F` |
| AurexAlphaHook | `0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4` |
| AurexPoolFactory | `0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40` |
| MockAUREX (Stake Token) | `0x8819A7972e17C61A4eeFe0F06e4bbef521228c82` |
| MockUSDC | `0x4229Df8c78F60D1Daf54035E01527B9B025C231d` |

### Live Pools

| Pool | Token0 | Token1 | Active Signal |
|------|--------|--------|--------------|
| WETH/USDC | WETH | USDC | riskScore=42, alphaScore=81 |
| USDC/WBTC | USDC | WBTC | riskScore=28, alphaScore=55 |
| USDT/WETH | USDT | WETH | riskScore=72, alphaScore=35 |
| USDC/WOKB | USDC | WOKB | riskScore=30, alphaScore=78 |

---

## Phase 2: Redeployment with Revenue Share (Complete)

**Goal**: Deploy updated Hook (with afterSwapReturnDelta) + updated PolicyManager to X Layer

The Hook now requires `AFTER_SWAP_RETURNS_DELTA_FLAG` in its address. This means a new CREATE2 deployment with updated salt to get the correct address flags.

### Tasks
- [x] Compute new CREATE2 salt for hook address with flags: BEFORE_SWAP | AFTER_SWAP | AFTER_SWAP_RETURNS_DELTA
- [x] Deploy new AurexAlphaHook with revenue share logic
- [x] Deploy updated AurexPolicyManager (publisherShareBps validation)
- [x] Recreate pools via PoolFactory with publisherShareBps configured
- [x] Re-register publisher + publish signals
- [x] Update `deployments/xlayer-mainnet.json`
- [ ] Verify contracts on X Layer Explorer

---

## Phase 3: Aurex Advisor — Self-hosted AI Trading App

**Goal**: Build the flagship Advisor application — a self-hosted MCP Server that completes the full execution loop from data aggregation to wallet execution.

### 3.1 Core Infrastructure (Done)

- [x] Project setup (`apps/advisor/`): TypeScript, Fastify, vitest, pino
- [x] HTTP API server (Fastify, same process as MCP)
- [x] Chain read layer: all contract read operations via viem PublicClient
- [x] Chain write layer: registerPublisher, publishSignal, verifySignal, claimFees, approveToken
- [x] Algorithmic signal engine: risk/alpha/liquidity/volatility scoring from price history
- [x] Auto Fetch + Auto Push loop: scheduled tick → fetch slot0 → score → threshold publish
- [x] SQLite price history store (WAL mode, auto-prune)
- [x] Test coverage: 127 tests passing

### 3.2 MCP Server + Tool Registration (Done)

- [x] MCP Server framework integration (`@modelcontextprotocol/sdk` + zod)
- [x] Tool: `advisor.market_status` — aggregated on-chain metrics + active signals
- [x] Tool: `advisor.get_strategy` — structured market context for AI client reasoning
- [x] Tool: `advisor.publish_signal` — publish signal to SignalRegistry
- [x] Tool: `advisor.risk_check` — evaluate risk of a proposed action
- [x] Tool: `advisor.behavior_alert` — query current behavior risk status
- [x] Tool: `advisor.configure` — update Advisor settings (risk thresholds, watched pools)
- [x] Tool: `advisor.publisher_stats` — accuracy, stake, revenue for connected publisher
- [x] Tool: `advisor.execute` — propose and execute trades through Hook pools
- [x] Tool: `advisor.confirm_execution` — confirm pending execution proposals
- [x] HTTP endpoints: GET /api/market, /api/strategy, /api/publisher, /api/behavior, /api/execute/pending, /api/plugin
- [x] HTTP endpoints: POST /api/configure, /api/publish, /api/behavior/record, /api/execute, /api/execute/confirm

### 3.3 Strategy Context Assembly (Done)

- [x] Context assembly: user state + active signals + publisher rankings + pool state
- [x] Structured output format for AI client consumption (JSON with bigint serialization)
- [x] Graceful error handling (partial data when some reads fail)
- [x] Action schema: swap, add_liquidity, remove_liquidity, wait, hedge, alert
- [x] Simulation: before/after portfolio comparison (risk exposure, concentration, drawdown, fees, slippage)

### 3.4 Behavior Risk Indicator (Done)

- [x] Metric tracking: trade frequency, single trade size, position concentration, consecutive direction, daily loss
- [x] Configurable thresholds (via config)
- [x] Alert levels: info → warning → critical
- [x] Minimum sample protection (avoids false positives on sparse data)
- [x] Historical behavior baseline from persistent SQLite storage (survives restarts)

### 3.5 On-chain Data Aggregation (Done)

Advanced data feeds beyond basic contract reads:

- [x] Whale wallet movements (large transfers >100 ETH via Transfer event logs)
- [x] Liquidity changes (ModifyLiquidity events from PoolManager)
- [x] Volume anomalies (Swap event aggregation vs historical average, configurable multiplier)
- [x] Price deviations across pools (cross-pool arbitrage detection)
- [x] Unified `aggregate()` method combining all data sources

### 3.6 Wallet Execution (Done)

- [x] Tool: `advisor.execute` — execute strategy actions through Hook pools
- [x] Transaction construction for swap (approve + policy check)
- [x] User confirmation flow: propose → await confirmation → execute
- [x] Execution result tracking (pending, completed, cancelled, history)
- [x] Risk gate: rejects swaps when pool has blockHighRiskTrades and signal exceeds maxRiskScore
- [x] Hedge action support with configurable ratio

### 3.7 AI Client Plugins (Done)

Adapters for AI clients to connect to the Advisor MCP Server:

- [x] OpenClaw plugin (streamable-http transport)
- [x] Cursor plugin (stdio transport, npx command)
- [x] Hermes plugin (SSE transport)
- [x] `GET /api/plugin?client=<type>` — auto-generate connection config
- [x] `generatePluginConfig()` utility for programmatic use

---

## Phase 4: Frontend — Advisor Dashboard

**Goal**: Web dashboard served by the Advisor itself. The Dashboard IS the Advisor's UI — no separate backend service. Users connect to their own local Advisor instance.

### Architecture

```
User's browser → http://localhost:3000 → Advisor (serves both HTTP API + static frontend)
                                           ↓
                                    On-chain contracts (X Layer)
```

The Advisor exposes an HTTP API alongside its MCP Server. The web dashboard (`apps/web/`) is a static Next.js app that calls this API. No separate API service exists.

### 4.1 Dashboard — Signal Market Overview
- [x] Top Publishers leaderboard (accuracy score, signal count, stake amount)
- [x] Latest signals across all pools (real-time feed, 15s auto-refresh)
- [x] Pool list with current risk/alpha status and signal validity
- [x] Protocol stats (active pools, valid signals, publishers, behavior level)

### 4.2 Create Pool Page (Permissionless)
- [ ] Token pair selector (any ERC20 on X Layer)
- [ ] Policy configuration (maxRisk, minLiquidity, defaultFee, maxFee, publisherShareBps)
- [ ] Publisher whitelist management
- [ ] Call PoolFactory.createPool() — anyone can do this
- [ ] Show created pool with poolId

### 4.3 Signals Page — Market View
- [x] All publishers' signals (not just "ours")
- [x] Filter by validity status (all/valid/expired)
- [x] Signal detail: risk/alpha/liquidity/volatility scores, expiry, publisher info
- [ ] Verification status (verified/pending/slashed)
- [x] No wallet connection required for browsing

### 4.4 Advisor Status Page
- [x] Connect wallet → show Advisor connection status
- [x] Display Advisor's published signals + accuracy history
- [x] Behavior risk indicator dashboard (current level + alerts)
- [x] Revenue dashboard: claimable fees display
- [x] Advisor configuration panel (score threshold, interval)

### 4.5 Terminal (Swap with Hook)
- [ ] Token selector + swap interface
- [x] Show which signal is currently active for this pool
- [x] Show dynamic fee being applied
- [ ] Show publisher revenue share breakdown
- [ ] Execute swap → show Proof-of-Alpha (tx hash, signal used, fee applied)

### 4.6 Wallet Integration
- [x] OKX Wallet / MetaMask connection (EIP-6963 auto-detect)
- [x] X Layer network configured (Chain 196)
- [ ] Transaction signing (swap execution)

---

## Phase 5: Third-party Agent Integration

**Goal**: Make it possible for any AI to connect to Aurex protocol (manual configuration)

### 5.1 aurex-mcp-server (Standalone)
- [ ] Standalone MCP Server for third-party agents (not Advisor)
- [ ] `aurex.get_market_data` — on-chain metrics for AI analysis
- [ ] `aurex.publish_signal` — sign and publish signal
- [ ] `aurex.get_pool_status` — current pool state + active signal
- [ ] `aurex.verify_signal` — trigger verification
- [ ] `aurex.claim_revenue` — claim accumulated fee revenue
- [ ] `aurex.get_publisher_stats` — accuracy, stake, revenue

### 5.2 aurex-sdk (TypeScript)
- [ ] Type-safe client for all contract interactions
- [ ] Signal construction + signing helpers
- [ ] Publisher registration flow
- [ ] Revenue claim flow
- [ ] Batch query helpers

### 5.3 Documentation & Examples
- [ ] "Build Your Own Signal Agent in 30 Minutes" guide
- [ ] Python agent example using LangChain + Aurex SDK
- [ ] OpenClaw plugin example for third-party agents
- [ ] Integration testing harness

---

## Phase 6: End-to-End Demo

**Goal**: Complete demo showing open signal marketplace + Advisor in action

### 6.1 Demo Script
```
1. Show Signal Market: multiple publishers, different accuracy scores
2. Create a new pool via PoolFactory (permissionless)
3. Set publisher whitelist for the pool
4. Start Advisor → auto-fetches on-chain data → generates strategy
5. Advisor publishes signal → pool picks it up
6. Execute swap → Hook reads signal → dynamic fee applied → publisher credited
7. Signal expires → verify → publisher accuracy updated (or slashed)
8. Publisher claims fee revenue
9. Show behavior indicator: trigger warning by simulating risky pattern
10. Show AI client interaction: user queries Advisor through OpenClaw
11. Full on-chain proof: everything verifiable on X Layer Explorer
```

### 6.2 Integration Testing
- [ ] Advisor ↔ on-chain contract read/write
- [ ] Advisor auto-fetch + auto-push cycle
- [ ] Frontend ↔ contract full swap flow
- [ ] Signal expiry + verification flow
- [ ] High-risk trade blocking
- [ ] Publisher whitelist enforcement
- [ ] Fee revenue share + claim flow
- [ ] Behavior indicator alert triggering
- [ ] AI client plugin communication

---

## Phase 7: Production Hardening

- [ ] PostgreSQL for signal history + analytics
- [ ] Redis caching for on-chain reads
- [ ] Indexer worker (listen to SignalPublished, SignalVerified, RevenueShared events)
- [ ] Multi-publisher fee revenue distribution optimization
- [ ] Advisor high-availability deployment guide
- [ ] Behavior indicator ML model (upgrade from rule-based to learned patterns)
- [ ] Advanced verification: oracle-based price feeds (Chainlink, Pyth)
- [ ] Cross-chain signal publishing
- [ ] Publisher reputation NFTs (on-chain track record)
- [ ] Governance: community voting on protocol parameters (minStake, slashPercent)

---

## Priority Matrix

| Priority | Item | Status |
|----------|------|--------|
| P0 | Contracts deployed to X Layer | Done |
| P0 | Hook works (dynamic fee + events) | Done |
| P0 | Permissionless pool creation | Done |
| P0 | Stake-to-publish model | Done |
| P0 | Signal verification (on-chain price) | Done |
| P0 | Slash mechanism | Done |
| P0 | Publisher whitelist | Done |
| P0 | Fee revenue share | Done |
| P0 | Advisor mode (batch queries) | Done |
| P0 | Redeploy Hook with revenue share flags | Done |
| P0 | Advisor infra (chain R/W, scorer, loop) | Done |
| P0 | MCP Server + Tool registration | Done |
| P0 | Strategy context assembly | Done |
| P0 | Behavior risk indicator | Done |
| P0 | On-chain data aggregation (whale, liquidity) | Done |
| P0 | Wallet execution (swap/LP) | Done |
| P0 | AI client plugins (OpenClaw/Cursor/Hermes) | Done |
| P1 | Frontend signal market browser | Done (core pages) |
| P2 | Third-party agent MCP/SDK | Phase 5 |
| P2 | End-to-end demo | Phase 6 |
| P3 | Production infra | Phase 7 |
