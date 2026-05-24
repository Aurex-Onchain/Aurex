# Aurex Contracts

Solidity smart contracts for the Aurex Signal Protocol, built on Uniswap V4 Hooks.

## Architecture

```
src/
  hooks/AurexAlphaHook.sol        — Uniswap V4 Hook (dynamic fee + revenue share)
  registry/AurexSignalRegistry.sol — Publisher lifecycle + signal storage + verification
  policy/AurexPolicyManager.sol    — Pool policy configuration
  factory/AurexPoolFactory.sol     — Permissionless pool creation
  tokens/MockAUREX.sol             — Stake token (testnet)
  tokens/MockUSDC.sol              — USDC mock (testnet)
  libraries/AurexTypes.sol         — Shared structs
  libraries/FeeMath.sol            — Fee computation
  interfaces/                      — Contract interfaces
```

## Build

```bash
forge build
```

## Test

```bash
forge test
```

## Deploy

```bash
cp .env.example .env
# Fill in DEPLOYER_PRIVATE_KEY
forge script script/DeployBase.s.sol --rpc-url $XLAYER_RPC_URL --broadcast
```

## Deployed (X Layer Mainnet)

| Contract | Address |
|----------|---------|
| AurexSignalRegistry | `0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f` |
| AurexPolicyManager | `0x025774B4e49b7Cb98D90111461B69Af98c301cD7` |
| AurexAlphaHook | `0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0` |
| AurexPoolFactory | `0x6708213b47715771e290e41599de14e45E8C4358` |
