// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";

/**
 * @title VerifySignals
 * @notice Trigger signal verification after expiry
 * @dev Run: forge script script/VerifySignals.s.sol --rpc-url xlayer --broadcast
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY - Any wallet with gas (verification is permissionless)
 *   SIGNAL_IDS - Comma-separated bytes32 signal IDs to verify
 */
contract VerifySignals is Script {
    address constant SIGNAL_REGISTRY = 0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45;

    function run() external {
        uint256 privateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        bytes32 signalId = vm.envBytes32("SIGNAL_ID");

        AurexSignalRegistry registry = AurexSignalRegistry(SIGNAL_REGISTRY);

        console.log("=== Verify Signal ===");
        console.logBytes32(signalId);
        console.log("");

        vm.startBroadcast(privateKey);
        registry.verifySignal(signalId);
        vm.stopBroadcast();

        console.log("Verification complete.");
        console.log("Result: Check publisher accuracy score for changes.");
    }
}
