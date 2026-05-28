# Demo Flow Transactions — X Layer Mainnet

This file documents real on-chain transactions executed as part of the Aurex demo flow.

## Network

- **Chain**: X Layer Mainnet
- **Chain ID**: 196
- **Block Explorer**: https://www.okx.com/web3/explorer/xlayer

## Publisher

- **Address**: `0x253a399B2A63b400f1e7f06f83Fbcc0F1236f62f`
- **Stake**: 100 AUREX
- **Status**: Active
- **Total Signals Published**: 8
- **Explorer**: https://www.okx.com/web3/explorer/xlayer/address/0x253a399B2A63b400f1e7f06f83Fbcc0F1236f62f

## Demo Flow Execution (2026-05-28)

### Signal Publication Transactions

All 4 signals published in a single demo run via `script/FullFlowDemo.s.sol`:

| # | Pool | Risk | Alpha | Liquidity | Volatility | Fee (bps) | Block | Tx Hash |
|---|------|------|-------|-----------|------------|-----------|-------|---------|
| 1 | WETH/USDC | 42 | 81 | 90 | 55 | 2000 | 61162122 | [`0x342b7ff5...`](https://www.okx.com/web3/explorer/xlayer/tx/0x342b7ff52aac194daac035ce9079bf65f9bd8910c5eafdad944ffde19b1cdc6d) |
| 2 | USDC/WBTC | 28 | 55 | 95 | 30 | 1500 | 61162124 | [`0xfc87ed8f...`](https://www.okx.com/web3/explorer/xlayer/tx/0xfc87ed8f5c0b9f65b6e2033ac6268ee2c83d04e42f9ed49dee136a9fb28270c6) |
| 3 | USDT/WETH | 72 | 35 | 60 | 85 | 7500 | 61162126 | [`0x63f63327...`](https://www.okx.com/web3/explorer/xlayer/tx/0x63f63327f6b9f5a9d299d89a25a962d4955a160fa44101a5a42f1dfc20d1e6f8) |
| 4 | USDC/WOKB | 30 | 78 | 70 | 40 | 2000 | 61162127 | [`0x7a588aa0...`](https://www.okx.com/web3/explorer/xlayer/tx/0x7a588aa06c55afde25756cc35e518c983df56e01b194d169616c4bce5aed5094) |

### Signal IDs

| Pool | Signal ID |
|------|-----------|
| WETH/USDC | `0x60c3106332fdd82f376205048a28bff44a2fa9ebf7d548f7ac5a4905b1b5dfda` |
| USDC/WBTC | `0x6a480899119ac4c90abaf2485d5ad8d0668279d760a37130ec04b11ead6bd445` |
| USDT/WETH | `0xe22a3f83eed1680e7b6bdfa6f92dddf4a51db57dfcdee2c1d12dd4f8b10ed11d` |
| USDC/WOKB | `0x8eab72f66f9794513d3f942fe63b58c0281b9338cd22f3941bebc91927e8c897` |

All signals expire 2 hours after publication and can be verified via `script/VerifySignals.s.sol`.

## Reproduce

```bash
cd contracts
cp .env.example .env
# Set DEPLOYER_PRIVATE_KEY in .env (publisher must have >= 100 AUREX)
./run-demo.sh
```

## Verify Signals (after 2 hours)

```bash
export DEPLOYER_PRIVATE_KEY=your-key
export SIGNAL_ID=0x60c3106332fdd82f376205048a28bff44a2fa9ebf7d548f7ac5a4905b1b5dfda
forge script script/VerifySignals.s.sol --rpc-url https://xlayerrpc.okx.com --broadcast
```

## Claim Revenue

```bash
forge script script/ClaimRevenue.s.sol --rpc-url https://xlayerrpc.okx.com --broadcast
```
