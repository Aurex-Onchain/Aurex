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
| AurexSignalRegistry | `0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45` |
| AurexPolicyManager | `0xEe55CF595586527d5ADE7065CD2766899b123E5F` |
| AurexAlphaHook | `0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4` |
| AurexPoolFactory | `0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40` |
