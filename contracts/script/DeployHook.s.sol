// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {AurexAlphaHook} from "../src/hooks/AurexAlphaHook.sol";

contract DeployHook is Script {
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS");
        address signalRegistryAddress = vm.envAddress("SIGNAL_REGISTRY_ADDRESS");
        address policyManagerAddress = vm.envAddress("POLICY_MANAGER_ADDRESS");

        bytes memory creationCode = abi.encodePacked(
            type(AurexAlphaHook).creationCode,
            abi.encode(poolManagerAddress, signalRegistryAddress, policyManagerAddress)
        );
        bytes32 initCodeHash = keccak256(creationCode);

        // Required flags: BEFORE_SWAP (bit 7 = 0x80) and AFTER_SWAP (bit 6 = 0x40)
        // The last 14 bits of the address must be EXACTLY 0x00C0 (only these two flags set)
        uint160 requiredFlags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);
        uint160 flagMask = uint160(0x3FFF); // last 14 bits

        // Mine salt
        bytes32 salt;
        address hookAddress;
        bool found = false;

        console.log("Mining for hook address with flags 0x00C0 (BEFORE_SWAP | AFTER_SWAP only)...");
        console.log("CREATE2 deployer:", CREATE2_DEPLOYER);
        console.log("Init code hash:");
        console.logBytes32(initCodeHash);

        for (uint256 i = 0; i < 5000000; i++) {
            salt = bytes32(i);
            hookAddress = address(uint160(uint256(keccak256(abi.encodePacked(
                bytes1(0xff),
                CREATE2_DEPLOYER,
                salt,
                initCodeHash
            )))));

            // Check that EXACTLY the required flags are set (no extra flags)
            if (uint160(hookAddress) & flagMask == requiredFlags) {
                found = true;
                console.log("Found valid address at salt:", i);
                console.log("Hook address:", hookAddress);
                break;
            }
        }

        require(found, "Could not find valid hook address within 5000000 iterations");

        // Deploy via CREATE2 deployer
        vm.startBroadcast(deployerPrivateKey);

        bytes memory payload = abi.encodePacked(salt, creationCode);
        (bool success,) = CREATE2_DEPLOYER.call(payload);
        require(success, "CREATE2 deployment failed");

        // Verify deployment
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(hookAddress)
        }
        require(codeSize > 0, "Hook not deployed at expected address");

        console.log("\n=== Hook Deployed ===");
        console.log("Hook address:", hookAddress);
        console.log("Salt:", uint256(salt));

        vm.stopBroadcast();
    }
}
