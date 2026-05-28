#!/bin/bash
# Aurex Full Flow Demo Runner
# Triggers a complete Publisher flow on X Layer Mainnet
# Usage: ./run-demo.sh

set -e

cd "$(dirname "$0")"

# Check environment
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  if [ -f .env ]; then
    echo "Loading .env..."
    set -a
    source .env
    set +a
  else
    echo "Error: DEPLOYER_PRIVATE_KEY not set"
    echo ""
    echo "Setup:"
    echo "  cd contracts"
    echo "  cp .env.example .env"
    echo "  # Edit .env and set DEPLOYER_PRIVATE_KEY"
    echo "  ./run-demo.sh"
    exit 1
  fi
fi

if [ -z "$XLAYER_RPC_URL" ]; then
  export XLAYER_RPC_URL="https://rpc.xlayer.tech"
  echo "Using default RPC: $XLAYER_RPC_URL"
fi

echo ""
echo "================================================="
echo "    Aurex Full Flow Demo - X Layer Mainnet"
echo "================================================="
echo ""

# Get publisher address from private key
PUBLISHER=$(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY)
echo "Publisher Address: $PUBLISHER"
echo ""

# Check OKB balance for gas
OKB_BALANCE=$(cast balance $PUBLISHER --rpc-url $XLAYER_RPC_URL)
echo "OKB Balance: $OKB_BALANCE wei"

if [ "$OKB_BALANCE" == "0" ]; then
  echo ""
  echo "Warning: Publisher has 0 OKB. Need OKB for gas fees."
  echo "Bridge OKB from OKX exchange or another L1 to: $PUBLISHER"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check AUREX balance
AUREX_BALANCE=$(cast call 0x8819A7972e17C61A4eeFe0F06e4bbef521228c82 "balanceOf(address)(uint256)" $PUBLISHER --rpc-url $XLAYER_RPC_URL)
echo "AUREX Balance: $AUREX_BALANCE"
echo ""

echo "================================================="
echo "    Running Full Flow Demo Script"
echo "================================================="
echo ""

# Run the full flow
forge script script/FullFlowDemo.s.sol \
  --rpc-url $XLAYER_RPC_URL \
  --broadcast \
  --slow \
  -vv

echo ""
echo "================================================="
echo "    Demo Complete!"
echo "================================================="
echo ""
echo "View transactions on X Layer Explorer:"
echo "  https://www.okx.com/web3/explorer/xlayer/address/$PUBLISHER"
echo ""
echo "View contracts:"
echo "  Signal Registry: https://www.okx.com/web3/explorer/xlayer/address/0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45"
echo "  Alpha Hook:      https://www.okx.com/web3/explorer/xlayer/address/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4"
echo ""
echo "Next steps:"
echo "  1. Wait 2 hours for signals to expire"
echo "  2. Run: forge script script/VerifySignals.s.sol --broadcast (per signal)"
echo "  3. Run: forge script script/ClaimRevenue.s.sol --broadcast"
