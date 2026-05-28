#!/bin/bash
# Aurex Contract Verification — Sourcify (recommended, no API key needed)
# Run: ./verify-sourcify.sh
#
# Sourcify uses metadata-hash matching, works on any EVM chain.
# Already-verified contracts will be skipped automatically.

set +e  # Don't exit on errors — try all contracts

cd "$(dirname "$0")"

if [ ! -d "out" ]; then
  echo "Building contracts first..."
  ~/.foundry/bin/forge build --skip test
fi

echo ""
echo "=== Aurex Contract Verification (Sourcify) ==="
echo "Network: X Layer Mainnet (Chain ID: 196)"
echo ""

# (address, source path, contract name)
declare -a CONTRACTS=(
  "0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f|src/registry/AurexSignalRegistry.sol:AurexSignalRegistry|AurexSignalRegistry"
  "0x025774B4e49b7Cb98D90111461B69Af98c301cD7|src/policy/AurexPolicyManager.sol:AurexPolicyManager|AurexPolicyManager"
  "0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0|src/hooks/AurexAlphaHook.sol:AurexAlphaHook|AurexAlphaHook"
  "0x6708213b47715771e290e41599de14e45E8C4358|src/factory/AurexPoolFactory.sol:AurexPoolFactory|AurexPoolFactory"
  "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82|src/tokens/MockAUREX.sol:MockAUREX|MockAUREX"
  "0x4229Df8c78F60D1Daf54035E01527B9B025C231d|src/tokens/MockUSDC.sol:MockUSDC|MockUSDC"
)

SUCCESS=0
ALREADY=0
FAILED=0

for entry in "${CONTRACTS[@]}"; do
  IFS='|' read -r ADDR SRC LABEL <<< "$entry"
  echo ""
  echo "[$LABEL] $ADDR"
  OUTPUT=$(~/.foundry/bin/forge verify-contract $ADDR $SRC --chain-id 196 --verifier sourcify 2>&1)

  if echo "$OUTPUT" | grep -q "partially matches\|fully matches\|Contract source code already verified"; then
    echo "  -> VERIFIED (partial or full match)"
    SUCCESS=$((SUCCESS + 1))
  elif echo "$OUTPUT" | grep -q "already partially verified\|already verified"; then
    echo "  -> ALREADY VERIFIED on Sourcify"
    ALREADY=$((ALREADY + 1))
  elif echo "$OUTPUT" | grep -q "bytecode length doesn't match"; then
    echo "  -> FAILED: deployed bytecode differs from current source"
    echo "     (source may have evolved post-deployment; redeploy to verify)"
    FAILED=$((FAILED + 1))
  else
    echo "  -> ERROR:"
    echo "$OUTPUT" | tail -3 | sed 's/^/     /'
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "=== Summary ==="
echo "Newly verified: $SUCCESS"
echo "Already verified: $ALREADY"
echo "Failed: $FAILED"
echo ""
echo "View on Sourcify:"
for entry in "${CONTRACTS[@]}"; do
  IFS='|' read -r ADDR _ LABEL <<< "$entry"
  echo "  $LABEL: https://repo.sourcify.dev/196/$ADDR"
done
echo ""
echo "View on OKX Explorer:"
for entry in "${CONTRACTS[@]}"; do
  IFS='|' read -r ADDR _ LABEL <<< "$entry"
  echo "  $LABEL: https://www.okx.com/web3/explorer/xlayer/address/$ADDR"
done
