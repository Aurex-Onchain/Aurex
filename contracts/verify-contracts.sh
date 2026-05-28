#!/bin/bash
# Aurex Contract Verification Script
# Run: ./verify-contracts.sh
# Requires: XLAYER_EXPLORER_API_KEY environment variable
# Get API key from: https://www.okx.com/web3/explorer/xlayer

set -e

if [ -z "$XLAYER_EXPLORER_API_KEY" ]; then
  echo "Error: XLAYER_EXPLORER_API_KEY not set"
  echo "Get your API key from: https://www.okx.com/web3/explorer/xlayer"
  echo "Then run: export XLAYER_EXPLORER_API_KEY=your-key-here"
  exit 1
fi

VERIFIER_URL="https://www.okx.com/web3/explorer/xlayer/api"
CHAIN_ID=196

# Contract addresses
POOL_MANAGER="0x360e68faccca8ca495c1b759fd9eee466db9fb32"
SIGNAL_REGISTRY="0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45"
POLICY_MANAGER="0xEe55CF595586527d5ADE7065CD2766899b123E5F"
ALPHA_HOOK="0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4"
POOL_FACTORY="0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40"
MOCK_AUREX="0x8819A7972e17C61A4eeFe0F06e4bbef521228c82"
MOCK_USDC="0x4229Df8c78F60D1Daf54035E01527B9B025C231d"

echo "=== Aurex Contract Verification ==="
echo "Network: X Layer Mainnet (Chain ID: $CHAIN_ID)"
echo ""

echo "[1/6] Verifying AurexSignalRegistry..."
forge verify-contract $SIGNAL_REGISTRY \
  src/registry/AurexSignalRegistry.sol:AurexSignalRegistry \
  --chain-id $CHAIN_ID \
  --verifier-url $VERIFIER_URL \
  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" $POOL_MANAGER $MOCK_AUREX) \
  --watch || echo "  -> Failed or already verified"

echo ""
echo "[2/6] Verifying AurexPolicyManager..."
forge verify-contract $POLICY_MANAGER \
  src/policy/AurexPolicyManager.sol:AurexPolicyManager \
  --chain-id $CHAIN_ID \
  --verifier-url $VERIFIER_URL \
  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \
  --watch || echo "  -> Failed or already verified"

echo ""
echo "[3/6] Verifying AurexAlphaHook..."
forge verify-contract $ALPHA_HOOK \
  src/hooks/AurexAlphaHook.sol:AurexAlphaHook \
  --chain-id $CHAIN_ID \
  --verifier-url $VERIFIER_URL \
  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $POOL_MANAGER $SIGNAL_REGISTRY $POLICY_MANAGER) \
  --watch || echo "  -> Failed or already verified"

echo ""
echo "[4/6] Verifying AurexPoolFactory..."
forge verify-contract $POOL_FACTORY \
  src/factory/AurexPoolFactory.sol:AurexPoolFactory \
  --chain-id $CHAIN_ID \
  --verifier-url $VERIFIER_URL \
  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address,address)" $POOL_MANAGER $ALPHA_HOOK $SIGNAL_REGISTRY $POLICY_MANAGER) \
  --watch || echo "  -> Failed or already verified"

echo ""
echo "[5/6] Verifying MockAUREX..."
forge verify-contract $MOCK_AUREX \
  src/tokens/MockAUREX.sol:MockAUREX \
  --chain-id $CHAIN_ID \
  --verifier-url $VERIFIER_URL \
  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \
  --watch || echo "  -> Failed or already verified"

echo ""
echo "[6/6] Verifying MockUSDC..."
forge verify-contract $MOCK_USDC \
  src/tokens/MockUSDC.sol:MockUSDC \
  --chain-id $CHAIN_ID \
  --verifier-url $VERIFIER_URL \
  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \
  --watch || echo "  -> Failed or already verified"

echo ""
echo "=== Verification Complete ==="
echo ""
echo "View contracts on explorer:"
echo "  AurexSignalRegistry: https://www.okx.com/web3/explorer/xlayer/address/$SIGNAL_REGISTRY"
echo "  AurexPolicyManager:  https://www.okx.com/web3/explorer/xlayer/address/$POLICY_MANAGER"
echo "  AurexAlphaHook:      https://www.okx.com/web3/explorer/xlayer/address/$ALPHA_HOOK"
echo "  AurexPoolFactory:    https://www.okx.com/web3/explorer/xlayer/address/$POOL_FACTORY"
echo "  MockAUREX:           https://www.okx.com/web3/explorer/xlayer/address/$MOCK_AUREX"
echo "  MockUSDC:            https://www.okx.com/web3/explorer/xlayer/address/$MOCK_USDC"
