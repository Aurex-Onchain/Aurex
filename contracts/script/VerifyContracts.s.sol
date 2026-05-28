// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

/**
 * @title VerifyContracts
 * @notice Helper script to display verification commands for all Aurex contracts
 * @dev This is a documentation/helper script. For actual verification, run:
 *      ./verify-contracts.sh from the contracts/ directory
 */
contract VerifyContracts is Script {
    // Deployed contract addresses (X Layer Mainnet) - with proper checksums
    address constant POOL_MANAGER = 0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32;
    address constant SIGNAL_REGISTRY = 0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45;
    address constant POLICY_MANAGER = 0xEe55CF595586527d5ADE7065CD2766899b123E5F;
    address constant ALPHA_HOOK = 0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4;
    address constant POOL_FACTORY = 0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40;
    address constant MOCK_AUREX = 0x8819A7972e17C61A4eeFe0F06e4bbef521228c82;
    address constant MOCK_USDC = 0x4229Df8c78F60D1Daf54035E01527B9B025C231d;

    function run() external view {
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

        console.log("To verify, run from contracts/ directory:");
        console.log("  export XLAYER_EXPLORER_API_KEY=your-key");
        console.log("  ./verify-contracts.sh");
        console.log("");
        console.log("Get API key from: https://www.okx.com/web3/explorer/xlayer");
    }
}
