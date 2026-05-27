// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

/**
 * @title VerifyContracts
 * @notice Script to verify all Aurex contracts on X Layer block explorer
 * @dev Run with: forge script script/VerifyContracts.s.sol --rpc-url xlayer --verify
 */
contract VerifyContracts is Script {
    // Deployed contract addresses (X Layer Mainnet)
    address constant POOL_MANAGER = 0x360e68faccca8ca495c1b759fd9eee466db9fb32;
    address constant SIGNAL_REGISTRY = 0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f;
    address constant POLICY_MANAGER = 0x025774B4e49b7Cb98D90111461B69Af98c301cD7;
    address constant ALPHA_HOOK = 0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0;
    address constant POOL_FACTORY = 0x6708213b47715771e290e41599de14e45E8C4358;
    address constant MOCK_AUREX = 0x8819A7972e17C61A4eeFe0F06e4bbef521228c82;
    address constant MOCK_USDC = 0x4229Df8c78F60D1Daf54035E01527B9B025C231d;

    function run() external {
        console.log("=== Aurex Contract Verification ===");
        console.log("Network: X Layer Mainnet (Chain ID: 196)");
        console.log("");

        console.log("Contracts to verify:");
        console.log("1. AurexSignalRegistry:", SIGNAL_REGISTRY);
        console.log("2. AurexPolicyManager:", POLICY_MANAGER);
        console.log("3. AurexAlphaHook:", ALPHA_HOOK);
        console.log("4. AurexPoolFactory:", POOL_FACTORY);
        console.log("5. MockAUREX:", MOCK_AUREX);
        console.log("6. MockUSDC:", MOCK_USDC);
        console.log("");

        console.log("To verify these contracts, run:");
        console.log("");
        console.log("forge verify-contract <ADDRESS> <CONTRACT_PATH>:<CONTRACT_NAME> \\");
        console.log("  --chain-id 196 \\");
        console.log("  --verifier-url https://www.okx.com/web3/explorer/xlayer/api \\");
        console.log("  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(args)\" <ARGS>)");
        console.log("");

        console.log("Example commands:");
        console.log("");

        console.log("# 1. AurexSignalRegistry");
        console.log("forge verify-contract", SIGNAL_REGISTRY, "src/registry/AurexSignalRegistry.sol:AurexSignalRegistry \\");
        console.log("  --chain-id 196 --verifier-url https://www.okx.com/web3/explorer/xlayer/api \\");
        console.log("  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address,address)\"", POOL_MANAGER, MOCK_AUREX, ")");
        console.log("");

        console.log("# 2. AurexPolicyManager");
        console.log("forge verify-contract", POLICY_MANAGER, "src/policy/AurexPolicyManager.sol:AurexPolicyManager \\");
        console.log("  --chain-id 196 --verifier-url https://www.okx.com/web3/explorer/xlayer/api \\");
        console.log("  --etherscan-api-key $XLAYER_EXPLORER_API_KEY");
        console.log("");

        console.log("# 3. AurexAlphaHook");
        console.log("forge verify-contract", ALPHA_HOOK, "src/hooks/AurexAlphaHook.sol:AurexAlphaHook \\");
        console.log("  --chain-id 196 --verifier-url https://www.okx.com/web3/explorer/xlayer/api \\");
        console.log("  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address,address,address)\"", POOL_MANAGER, SIGNAL_REGISTRY, POLICY_MANAGER, ")");
        console.log("");

        console.log("# 4. AurexPoolFactory");
        console.log("forge verify-contract", POOL_FACTORY, "src/factory/AurexPoolFactory.sol:AurexPoolFactory \\");
        console.log("  --chain-id 196 --verifier-url https://www.okx.com/web3/explorer/xlayer/api \\");
        console.log("  --etherscan-api-key $XLAYER_EXPLORER_API_KEY \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address,address,address,address)\"", POOL_MANAGER, ALPHA_HOOK, SIGNAL_REGISTRY, POLICY_MANAGER, ")");
        console.log("");

        console.log("# 5. MockAUREX");
        console.log("forge verify-contract", MOCK_AUREX, "src/tokens/MockAUREX.sol:MockAUREX \\");
        console.log("  --chain-id 196 --verifier-url https://www.okx.com/web3/explorer/xlayer/api \\");
        console.log("  --etherscan-api-key $XLAYER_EXPLORER_API_KEY");
        console.log("");

        console.log("# 6. MockUSDC");
        console.log("forge verify-contract", MOCK_USDC, "src/tokens/MockUSDC.sol:MockUSDC \\");
        console.log("  --chain-id 196 --verifier-url https://www.okx.com/web3/explorer/xlayer/api \\");
        console.log("  --etherscan-api-key $XLAYER_EXPLORER_API_KEY");
        console.log("");

        console.log("Note: Make sure XLAYER_EXPLORER_API_KEY is set in your environment");
        console.log("Get API key from: https://www.okx.com/web3/explorer/xlayer");
    }
}
