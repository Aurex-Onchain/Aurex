# Aurex Demo Video Script

**Target length**: 3 min 30 sec (≤ 4 min)
**Audience**: Hook the Future judges (X Layer × Uniswap × Flap)
**Tone**: Confident, technical, focused on Hook mechanics
**Format**: Screen recording + voiceover (English primary, ZH subtitle optional)
**Recording URL**: https://web-sigma-virid-60.vercel.app

---

## Pre-recording Checklist

- [ ] Open https://web-sigma-virid-60.vercel.app in **dark mode** (looks better on video)
- [ ] Pre-load all 7 routes once so they're cached (Dashboard / Signals / Hook Pools / Terminal / Advisor / Feed / Create Pool)
- [ ] Have OKX X Layer Explorer ready in another tab: https://www.okx.com/web3/explorer/xlayer/address/0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45
- [ ] Have Sourcify page ready: https://repo.sourcify.dev/196/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4
- [ ] Open VS Code with `contracts/src/hooks/AurexAlphaHook.sol` for code shot
- [ ] Close all distracting tabs / notifications
- [ ] Use 1920×1080 recording, 60fps if possible
- [ ] Mic test: speak naturally, no need to be a TV announcer

---

## Scene 1 — Hook & Problem (0:00 – 0:25)

**Screen:** Vercel demo landing page (Dashboard), let mouse hover over the publisher leaderboard.

**Voiceover (EN):**

> "On-chain alpha lives in Discord groups, paywalled Telegrams, and screenshots.
> When a call goes wrong, the audience pays. The caller? Walks away.
> We built Aurex — a signal marketplace where signals come with skin in the game,
> on Uniswap V4 Hooks, on X Layer."

**Voiceover (ZH 可选):**

> "链上 Alpha 现在散落在 Discord、Telegram 付费群、推文截图里。
> 决策错了，听众买单，喊单的人拍拍屁股走人。
> 我们做了 Aurex —— 一个信号本身就要押注的市场，建在 Uniswap V4 Hook 之上，跑在 X Layer 上。"

**Tip:** Start zoomed in on the leaderboard accuracy scores. The visual hook is "publishers have on-chain reputation."

---

## Scene 2 — Solution Overview (0:25 – 0:50)

**Screen:** Slide overlay or talking head with simple diagram:

```
Publisher → stake AUREX → publish signal
              ↓
   Hook reads signal → dynamic fee on swap
              ↓
   Accurate → fee revenue
   Wrong → 10% slash
```

**Voiceover:**

> "Here's how Aurex works in three sentences.
> Anyone can stake AUREX tokens to become a signal publisher.
> When a swap happens through a Hook pool, the Hook reads the latest signal
> and applies a dynamic fee — accurate publishers earn a share of every swap;
> wrong predictions get 10% of their stake slashed.
> No token inflation. No subscription. Pure economics."

**Tip:** Speak slowly. This is the elevator pitch — don't rush it.

---

## Scene 3 — Hook Mechanics Deep Dive (0:50 – 2:00) ★ CORE

This is the section judges care about. Spend the most time here.

### 3a. Show the Hook contract code (0:50 – 1:15)

**Screen:** Switch to VS Code, open `contracts/src/hooks/AurexAlphaHook.sol`. Highlight the `beforeSwap` function.

**Voiceover:**

> "AurexAlphaHook is a Uniswap V4 native hook with three flags:
> BEFORE_SWAP, AFTER_SWAP, and AFTER_SWAP_RETURNS_DELTA.
> In beforeSwap, we read the latest signal from the registry,
> compute a dynamic fee using the formula:"

**Screen:** Cut to a slide or text overlay with the formula:

```
fee = defaultFee + (maxFee - defaultFee) × riskScore / 100
```

**Voiceover continues:**

> "If the signal carries a recommendedFee within policy bounds, we use that directly.
> Otherwise we interpolate based on the signal's risk score.
> A signal saying 'risk = 80' triggers a high fee that protects LPs;
> 'risk = 10' relaxes the fee to attract volume."

### 3b. Show the live result on Terminal page (1:15 – 1:40)

**Screen:** Switch to https://web-sigma-virid-60.vercel.app/terminal and pick the WETH/USDC pool.

**Voiceover:**

> "Here on the Terminal you can see the Hook's effect in real time.
> Active signal: risk 42, alpha 81. Hook applied a 0.20% fee —
> down from the default 0.30% because liquidity is healthy.
> Switch pools — USDT/WETH risk 72 — the Hook escalates to 0.75%."

**Tip:** Point your cursor at the "Hook Action Applied" panel that animates `defaultFee → dynamicFee`. Let the viewer see the number flow.

### 3c. Revenue share animation in afterSwap (1:40 – 2:00)

**Screen:** Switch back to VS Code, scroll to `afterSwap` in `AurexAlphaHook.sol`.

**Voiceover:**

> "After the swap closes, AFTER_SWAP_RETURNS_DELTA lets the Hook
> claim its publisher share — typically 5% of swap output —
> and credit it to the signal publisher's claimable balance.
> No off-chain accounting. The Hook IS the accountant.
> Every swap auto-pays the publisher whose signal made it possible."

**Tip:** Highlight the `publisherShareBps` math in the code, not the whole function.

---

## Scene 4 — Self-hosted Advisor + AI Clients (2:00 – 2:40)

**Screen:** Navigate to https://web-sigma-virid-60.vercel.app/advisor

**Voiceover:**

> "But protocols aren't products. So we built Aurex Advisor — a self-hosted MCP server.
> Your keys, your data, your AI.
> The Advisor speaks Model Context Protocol so it works with nine AI clients out of the box —"

**Screen:** Scroll down to the "Supported AI Clients" grid.

**Voiceover continues:**

> "Claude Code, Cursor, Windsurf, Cline, Continue.dev, Zed, Claude Desktop, OpenClaw, Hermes.
> Click any of them and you get a copy-paste config for that client."

**Screen:** Click on "Claude Code" card to expand it, hover over the JSON config.

**Voiceover:**

> "The Advisor pushes structured market context to your AI client,
> monitors your trading behavior for risk anomalies,
> and executes through Hook pools when you confirm. Behavior monitor right here
> tracks six metrics — trade frequency, position concentration, daily PnL —
> all locally, all yours."

**Tip:** Don't read the whole client list. Just say "9 clients" and point at the grid.

---

## Scene 5 — ExchangeOS Deep Integration (2:40 – 3:05)

**Screen:** Stay on Advisor page, scroll to publisher status (showing 100 AUREX staked).

**Voiceover:**

> "Aurex isn't a silo. It plugs natively into OKX ExchangeOS.
> Signals are signed by OnchainOS Agentic Wallet —
> private keys never leave the TEE.
> Every contract call passes through OKX security tx-scan first,
> blocking malicious calldata before it gets signed.
> Aurex provides intelligence. ExchangeOS provides secure execution.
> Together: an AI-native trading stack with zero key exposure."

**Screen:** Quick cut to the README ExchangeOS section showing the integration table (or a slide).

---

## Scene 6 — Live On-chain Proof + Outro (3:05 – 3:30)

**Screen:** Switch to OKX X Layer Explorer at the publisher address `0x253a399B...62f`.

**Voiceover:**

> "All of this is live on X Layer mainnet today.
> Six contracts, all verified on Sourcify.
> Eight signals published on-chain.
> 100 AUREX staked. Real transactions, real economics."

**Screen:** Switch to Sourcify page showing AurexAlphaHook verified.

**Screen:** Final slide / outro:

```
Aurex
github.com/Aurex-Onchain/Aurex
Live: web-sigma-virid-60.vercel.app

Hook the Future ✦ X Layer × Uniswap × Flap
```

**Voiceover:**

> "Aurex. Hook the future. We did."

---

## Hard Numbers to Drop in the Voiceover (use any 2-3)

- **6 contracts** verified on Sourcify
- **34 tests** passing for the Hook + Registry + Policy
- **9 AI clients** supported via MCP
- **4 live pools** on X Layer Mainnet
- **8+ signals** published on-chain
- **100 AUREX** = minimum stake to publish
- **10% slash** per inaccurate signal
- **publisherShareBps capped at 5000** (50% max revenue share)

---

## Recording Strategy

### Option A — Single take with screen + voice (easier)

Record screen actions while reading the script. Re-record any section that flubs.

### Option B — Separate audio + screen (more polished)

1. Record clean voiceover first using the script (one take per scene)
2. Record screen actions silently following the same script
3. Edit them together in CapCut / DaVinci / Final Cut

### Option C — Talking head intro/outro + screen middle (most personal)

- Talking head for Scenes 1 and 6 (camera on face)
- Screen capture only for Scenes 2-5

I recommend **Option B** for hackathon submissions — it sounds professional without requiring on-camera presence.

---

## Common Pitfalls to Avoid

- ❌ Don't show the Demo Banner being dismissed on camera (looks like you're hiding something). Either dismiss it before recording or keep it visible (it's actually a positive signal — proves you understand the difference between mock and self-host).
- ❌ Don't say "buy AUREX" or "get rich" — AUREX is a quality bond, not a speculation token. Saying otherwise loses you credibility points.
- ❌ Don't speed-read the Hook formula. It's the most important visual in the video. Pause on it for 2-3 seconds.
- ❌ Don't show wallet private keys, even by accident. Hide your wallet UI before recording.
- ❌ Don't use stock music with copyright issues. YouTube Audio Library or Epidemic Sound have free options.
- ❌ Don't go over 4 minutes. Judges watch dozens of submissions; brevity wins.

---

## Captions / Subtitles

Add English captions burned-in (most judges watch on mute first). Use a clean monospaced font for code shots, and a sans-serif for narration captions.

If you want bilingual captions, put English on top and Chinese below — same time codes:

```
00:00.000 --> 00:08.000
On-chain alpha lives in Discord groups, paywalled Telegrams, and screenshots.
链上 Alpha 现在散落在 Discord、Telegram 付费群、推文截图里。
```

---

## Submission Checklist (after recording)

- [ ] Video < 4 minutes
- [ ] Resolution ≥ 1080p
- [ ] Captions burned in
- [ ] Voice clearly audible (test on phone speaker)
- [ ] Hook mechanism explained with the formula visible on screen
- [ ] Live URL shown at least once
- [ ] GitHub link shown at least once
- [ ] Sourcify verification shown
- [ ] X Layer explorer shown (real on-chain tx)
- [ ] Outro screen with project name + URL
- [ ] Upload to YouTube as **Unlisted** + add link to README + X post + hackathon submission form

---

## Final README Update (after video is posted)

Add this near the top of `README.md`:

```markdown
## Demo Video

🎥 **Watch the 3-minute demo**: [YouTube link]

Covers:
- Open signal marketplace mechanics
- AurexAlphaHook dynamic fee + revenue share
- Self-hosted Advisor + 9 AI client integrations
- OKX ExchangeOS deep integration
- Live on-chain proof on X Layer Mainnet
```

---

## Bonus: Twitter Thread to Post With the Video

```
Tweet 1:
🎥 Aurex demo is up — 3 minutes, no fluff.

What you'll see:
→ How Uniswap V4 Hooks read on-chain signals to set dynamic fees
→ How accurate publishers earn from real swap fees (not inflation)
→ How wrong calls get slashed on-chain
→ How 9 AI clients plug into our self-hosted Advisor

[YouTube link]

Tweet 2:
The Hook formula:
   fee = defaultFee + (maxFee - defaultFee) × riskScore / 100

Reads from signal → applied in beforeSwap → reverts if risk > maxRiskScore + blocking enabled.

afterSwap takes publisherShareBps from the output and credits the signal publisher.

Pure V4 mechanics. No off-chain trust.

Tweet 3:
Live on @XLayerOfficial today.
6 contracts verified on Sourcify.
8+ signals already published on-chain.

Co-built for #HookTheFuture by @XLayerOfficial @Uniswap @flapprotocol.

github.com/Aurex-Onchain/Aurex
web-sigma-virid-60.vercel.app
```
