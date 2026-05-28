# Aurex — X (Twitter) Content Pack

**Account**: [@0xAurex_ai](https://twitter.com/0xAurex_ai)
**Repo**: https://github.com/Aurex-Onchain/Aurex
**Live Demo**: https://web-sigma-virid-60.vercel.app
**Hackathon**: Hook the Future (X Layer × Uniswap × Flap)

---

## 1. Pinned Tweet / Bio

**Bio (160 chars max):**

```
Open Signal Marketplace on Uniswap V4 Hooks. Stake → publish → earn. Self-hosted AI advisor for every wallet. Built on @XLayerOfficial. #HookTheFuture
```

**Profile setup:**
- Display name: `Aurex` or `Aurex Protocol`
- Location: `Onchain`
- Website: `https://github.com/Aurex-Onchain/Aurex`
- Banner: use a screenshot of the Dashboard or a hero image with the Aurex name + "Signals you can trust, fees you can earn"

---

## 2. Launch Thread — Project Introduction

**Tweet 1/8 (hook):**

```
gm.

We built Aurex: an Open Signal Marketplace on Uniswap V4 Hooks.

Anyone can publish trading signals. Good signals earn real swap fees. Bad signals get slashed.

No gatekeepers. No token inflation. Just economic truth.

Live on @XLayerOfficial 🧵
```

**Tweet 2/8:**

```
The problem with alpha today:

• Trading signals live in Discords, Telegrams, paywalls
• Zero accountability — bad calls cost the audience, never the caller
• Quality is gated by who you know, not what you predict

Aurex flips this onchain.
```

**Tweet 3/8:**

```
How it works:

1. Stake ≥100 AUREX → become a publisher
2. Publish signals (risk / alpha / liquidity / volatility scores)
3. Pools whitelisting you take your signal → drive dynamic fees
4. You earn a cut of every swap

Wrong signal? 10% of your stake gets slashed.
```

**Tweet 4/8:**

```
The Hook:

AurexAlphaHook reads the latest signal in beforeSwap() and computes a dynamic fee:

  fee = defaultFee + (maxFee - defaultFee) × riskScore / 100

afterSwap() takes publisherShareBps from output → credits the publisher.

Pure Uniswap V4 mechanics. No off-chain trust.
```

**Tweet 5/8:**

```
Aurex Advisor: the flagship app built on the protocol.

A self-hosted MCP Server that:
• Auto-fetches onchain data + signals
• Publishes signals algorithmically  
• Monitors your behavior (anti-all-in)
• Executes through Hook pools

Your keys. Your data. Your AI.
```

**Tweet 6/8:**

```
Aurex Advisor speaks MCP — so it works with:

• Claude Code
• Cursor
• Windsurf
• Cline
• Continue.dev
• Zed
• Claude Desktop
• OpenClaw
• Hermes

One backend. Nine AI clients. Add your own.
```

**Tweet 7/8:**

```
Deep integration with @okx ExchangeOS:

• OnchainOS Agentic Wallet → TEE signing
• OKX Security Scan → blocks malicious calldata before signing
• X Layer → native deployment chain

Aurex provides intelligence. ExchangeOS provides secure execution. The combo gives users an AI-native trading stack with zero key exposure.
```

**Tweet 8/8:**

```
Live on X Layer Mainnet:

📜 Code: github.com/Aurex-Onchain/Aurex
🌐 Demo: web-sigma-virid-60.vercel.app
📖 Whitepaper: in repo /docs

8+ signals already published onchain. 4 active pools.

Built for Hook the Future @XLayerOfficial @Uniswap @flapdotsh

Hook the future. We did.
```

---

## 3. Whitepaper TLDR Thread

**Tweet 1/6:**

```
Whitepaper drop: Aurex Protocol v1.1

A 15-page technical spec covering:

→ AUREX = signal quality bond (stake + slash, NOT inflation)
→ Hook-driven dynamic fees from real-time signals
→ Self-hosted AI advisor architecture
→ Open MCP interface for any AI client

Link 👇
```

**Tweet 2/6:**

```
Token mechanics, in plain English:

Publisher locks 100 AUREX → publishes signal
  └─ Signal is right → keeps earning fees
  └─ Signal is wrong → 10% of stake burned

EV = (swap volume × fee × publisherShare) − (slash on bad calls)

Only honest alpha survives long-term.
```

**Tweet 3/6:**

```
Hook contract is a Uniswap V4 native:

beforeSwap → reads latest signal → computes fee
afterSwap → takes publisherShareBps → credits publisher

Flags: BEFORE_SWAP | AFTER_SWAP | AFTER_SWAP_RETURNS_DELTA

CREATE2'd with the correct hook address. No proxy. No upgrade keys.
```

**Tweet 4/6:**

```
Signal Verification (the killer feature):

Each signal locks the slot0 price at publish.
After expiry, anyone calls verifySignal() →
  - Compare priceAtPublish vs current slot0
  - alphaScore > 50 + price dropped? → SLASH
  - Prediction matched? → accuracy +1

No oracle dependency. Uniswap itself is the truth.
```

**Tweet 5/6:**

```
Advisor architecture:

```
AI client (Claude/Cursor/...)
       ↓ MCP
Aurex Advisor (self-hosted)
       ↓
  Signal engine (algorithmic, no LLM)
  Behavior monitor (anti-all-in)
  Wallet executor (TEE via OnchainOS)
       ↓
   X Layer chain
```

The LLM is YOUR LLM. The keys are YOUR keys.
```

**Tweet 6/6:**

```
Full whitepaper + contracts deployed:

📜 docs/AUREX_ARCHITECTURE_WHITEPAPER.md
🧪 34 tests passing
🌐 4 live pools on X Layer Mainnet
🔌 9 AI clients supported via MCP

github.com/Aurex-Onchain/Aurex

RT if you'd run your own signal agent ↻
```

---

## 4. Hackathon Submission Announcement

**Single tweet (high-impact):**

```
🏆 Submitting Aurex to #HookTheFuture

A new market structure for trading alpha:
• Stake AUREX → publish signals
• Hook reads signals → dynamic fees
• Right calls earn. Wrong calls slash.

Live on @XLayerOfficial. Powered by @Uniswap V4. Co-built with @flapdotsh.

🔗 github.com/Aurex-Onchain/Aurex
🌐 web-sigma-virid-60.vercel.app
```

**Or as a 3-tweet thread:**

**Tweet 1/3:**

```
We're submitting to Hook the Future 🪝

Aurex turns Uniswap V4 Hooks into an open signal marketplace.

Anyone can publish trading signals onchain. Hook reads them. Dynamic fees flow. Publishers earn.

Built on @XLayerOfficial. A new asset class hidden in plain sight.
```

**Tweet 2/3:**

```
What's new vs. existing alpha markets:

❌ Numerai → token inflation pays callers
✅ Aurex → real swap fees pay callers

❌ Discord/TG → no accountability
✅ Aurex → 10% stake slashed on bad signals

❌ Oracles → external dependency  
✅ Aurex → Uniswap's slot0 IS the oracle
```

**Tweet 3/3:**

```
Hook the Future said: "good projects keep getting carried forward."

So we built something that compounds:

→ Better signals → more pools whitelist you
→ More volume → more fee revenue
→ Reputation lives on-chain forever

This is what V4 Hooks were made for.

@XLayerOfficial @Uniswap @flapdotsh
```

---

## 5. Ongoing Content Calendar (first 2 weeks)

| Day | Topic | Format |
|-----|-------|--------|
| D1 | Launch thread (above) | 8-tweet thread |
| D2 | Whitepaper TLDR (above) | 6-tweet thread |
| D3 | Hackathon submission (above) | 3-tweet thread or single tweet |
| D4 | Video walkthrough of Dashboard | Native video upload |
| D5 | Hook contract deep-dive (`beforeSwap` snippet + explanation) | Single tweet w/ image |
| D6 | Why self-hosted matters | Single tweet |
| D7 | How to become a publisher (step-by-step) | Thread (4-5 tweets) |
| D8 | "We connect 9 AI clients" — visual grid | Image + tweet |
| D9 | Live signal example — show actual onchain tx + outcome | Tweet w/ tx link |
| D10 | OnchainOS Agentic Wallet integration explainer | Thread |
| D11 | First publisher slashed (when it happens — honest moment) | Tweet |
| D12 | Behavior risk indicator demo | Video/GIF |
| D13 | Q&A — answer top community questions | Thread |
| D14 | Roadmap reveal (next 30 days) | Thread |

---

## 6. Reply Templates

**When someone asks "why X Layer?"**

```
X Layer = lowest fees + native OKX ecosystem integration. We get gas ~$0.0001 per signal publish, plus deep coupling with OnchainOS Agentic Wallet for TEE signing. Couldn't build this on mainnet — too expensive to publish 100s of signals/day.
```

**When someone asks "is this just Numerai onchain?"**

```
Different incentive layer. Numerai mints CRYPTO to pay you. Aurex pays you from REAL swap fees — the protocol earns from usage, not inflation. If no one swaps through pools using your signal, you earn nothing. Pure usage economics.
```

**When someone asks "what's the AUREX token utility?"**

```
AUREX = signal quality bond. ONE function: economic collateral that backs your signals. No governance vote. No staking yield. No emission rewards. If you publish bad signals, your AUREX gets slashed. Real skin in the game.
```

**When someone asks "self-hosted? sounds hard"**

```
3 commands:
  git clone …
  pnpm install
  pnpm dev:advisor

Your local advisor runs on port 3100. Connect any MCP client (Claude Code, Cursor, etc.). Done. The Vercel demo is just a UI shell — for real use you self-host.
```

---

## 7. Tags & Mentions Cheat Sheet

**Always tag in launch posts:**
- @XLayerOfficial
- @Uniswap
- @flapdotsh
- @okx (for ExchangeOS / OnchainOS posts)

**Hashtags (use sparingly, max 2 per tweet):**
- #HookTheFuture
- #UniswapV4
- #XLayer

**Mention when relevant:**
- @AnthropicAI (when talking Claude integration)
- @cursor_ai (when talking Cursor)
- @windsurf_ai

---

## 8. Visual Assets To Prepare

- [ ] Profile picture (square, 400×400) — Aurex logo
- [ ] Banner image (1500×500) — "Signals you can trust, fees you can earn"
- [ ] Hook flow diagram (for Tweet 4 of launch thread)
- [ ] Advisor architecture diagram (for Tweet 5 of launch thread)
- [ ] Demo video / GIF (≤140 seconds, ≤512MB)
- [ ] Screenshot of Dashboard `/feed` page

---

## 9. Don'ts

- ❌ Don't promise token launch / airdrop. AUREX is a quality bond, not a speculation vehicle.
- ❌ Don't say "guaranteed yield" or "passive income." Publishing has slash risk.
- ❌ Don't shill price. Talk product.
- ❌ Don't reply to bots. Block, don't engage.
- ❌ Don't post the Vercel demo without the "showcase only" disclaimer.
