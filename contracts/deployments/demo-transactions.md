# Demo Flow Transactions — X Layer Mainnet (v3)

This file documents real on-chain transactions executed against the v3 (verified) contracts.

## Network

- **Chain**: X Layer Mainnet
- **Chain ID**: 196
- **Block Explorer**: https://www.okx.com/web3/explorer/xlayer

## Publisher

- **Address**: `0x253a399B2A63b400f1e7f06f83Fbcc0F1236f62f`
- **Stake**: 100 AUREX (locked in new SignalRegistry v3)
- **Status**: Active
- **Explorer**: https://www.okx.com/web3/explorer/xlayer/address/0x253a399B2A63b400f1e7f06f83Fbcc0F1236f62f

## v3 Demo Flow (2026-05-28)

Run via `script/FullFlowDemo.s.sol` against newly verified contracts.

### Setup transactions

| # | Action | Block | Tx Hash |
|---|--------|-------|---------|
| 1 | approve(SignalRegistry, 100 AUREX) | 61180688 | [`0x0fad757a...`](https://www.okx.com/web3/explorer/xlayer/tx/0x0fad757af4f299a4b506400d9a418882c081dbd23e5c526b3897f1ab2c2445c6) |
| 2 | registerPublisher(100 AUREX) | 61180690 | [`0x54a88710...`](https://www.okx.com/web3/explorer/xlayer/tx/0x54a88710f11f24bd9998605b7e98402d4c76825e7ed9513b16f569428f0afbf7) |

### Signal publication transactions

| # | Pool | Risk | Alpha | Liquidity | Volatility | Fee (bps) | Block | Tx Hash |
|---|------|------|-------|-----------|------------|-----------|-------|---------|
| 1 | WETH/USDC | 42 | 81 | 90 | 55 | 2000 | 61180692 | [`0x6f45203e...`](https://www.okx.com/web3/explorer/xlayer/tx/0x6f45203ebb0ffd864380e2270593e1fb18eb2768918d7de58516685b107bba85) |
| 2 | USDC/WBTC | 28 | 55 | 95 | 30 | 1500 | 61180695 | [`0xb3cdbd8d...`](https://www.okx.com/web3/explorer/xlayer/tx/0xb3cdbd8ddafcb3a0284c7d26d6e40065cbd2c0e39462af8d41fb953b0c9f4e56) |
| 3 | USDT/WETH | 72 | 35 | 60 | 85 | 7500 | 61180697 | [`0xb56ca96a...`](https://www.okx.com/web3/explorer/xlayer/tx/0xb56ca96a03fbec749eefc27ae2c5b9b645d56b913710dbfcd75bcd2646f4c5b8) |
| 4 | USDC/WOKB | 30 | 78 | 70 | 40 | 2000 | 61180698 | [`0x609daca3...`](https://www.okx.com/web3/explorer/xlayer/tx/0x609daca30c61bce5656315606ad8ff7a696788ee1c521163118d640a4f637035) |

## v3 Contract Deployment Transactions (2026-05-28)

Deployment of all 4 core contracts via `script/RedeployCore.s.sol`:

| Contract | Block | Tx Hash | Verified |
|----------|-------|---------|----------|
| AurexSignalRegistry | 61177664 | [`0x0c5201a2...`](https://www.okx.com/web3/explorer/xlayer/tx/0x0c5201a29f5bb12a9225d0856d56b80d5a2fe568a21e3b16d83e541357e5feba) | [✓ Sourcify](https://repo.sourcify.dev/196/0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45) |
| AurexPolicyManager | 61177665 | [`0x8e4acc94...`](https://www.okx.com/web3/explorer/xlayer/tx/0x8e4acc94e39a977e26ae439e6e8f70700b5a4cb1a9c2f7eac4bb36f53d948d34) | [✓ Sourcify](https://repo.sourcify.dev/196/0xEe55CF595586527d5ADE7065CD2766899b123E5F) |
| AurexAlphaHook (CREATE2 salt 4482) | 61177667 | [`0x8f9944db...`](https://www.okx.com/web3/explorer/xlayer/tx/0x8f9944db958965c777f7219c8a08cb9f8c89ccc2d39e51a3e05814adb5d8d683) | [✓ Sourcify](https://repo.sourcify.dev/196/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4) |
| AurexPoolFactory | 61177668 | [`0x983d6e1b...`](https://www.okx.com/web3/explorer/xlayer/tx/0x983d6e1bbd8b7294dbd8f2817004f4c6de2cd38af9906d6ff3c0e3dfed88183e) | [✓ Sourcify](https://repo.sourcify.dev/196/0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40) |

## Reproduce

```bash
cd contracts
cp .env.example .env
# Set DEPLOYER_PRIVATE_KEY in .env
./run-demo.sh
```

## v2 Predecessor (deprecated, but on-chain)

Earlier deployment from May 2025. These contracts are functional on-chain but
the source code has since evolved, so they cannot be matched against the
current commit. They are preserved here for historical reference:

- AurexSignalRegistry: `0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f`
- AurexPolicyManager: `0x025774B4e49b7Cb98D90111461B69Af98c301cD7`
- AurexAlphaHook: `0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0`
- AurexPoolFactory: `0x6708213b47715771e290e41599de14e45E8C4358`

The v2 demo flow had these transactions (still queryable on the explorer):
- `0x342b7ff5...`, `0xfc87ed8f...`, `0x63f63327...`, `0x7a588aa0...`
