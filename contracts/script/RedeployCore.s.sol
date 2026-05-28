// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {AurexAlphaHook} from "../src/hooks/AurexAlphaHook.sol";
import {AurexPoolFactory} from "../src/factory/AurexPoolFactory.sol";
import {IAurexSignalRegistry} from "../src/interfaces/IAurexSignalRegistry.sol";
import {IAurexPolicyManager} from "../src/interfaces/IAurexPolicyManager.sol";

/**
 * @title RedeployCore
 * @notice One-shot: redeploy all 4 core contracts. Reuses existing MockAUREX/MockUSDC.
 * @dev Run: forge script script/RedeployCore.s.sol --rpc-url $XLAYER_RPC_URL --broadcast --slow
 */
contract RedeployCore is Script {
    // Reused (already verified, has user balances)
    address constant POOL_MANAGER = 0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32;
    address constant MOCK_AUREX = 0x8819A7972e17C61A4eeFe0F06e4bbef521228c82;

    // CREATE2 deployer (deterministic on all EVM chains)
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);

        console.log("=== Redeploying Aurex Core (X Layer Mainnet) ===");
        console.log("Deployer:", deployer);
        console.log("PoolManager (reused):", POOL_MANAGER);
        console.log("MockAUREX (reused):  ", MOCK_AUREX);
        console.log("");

        vm.startBroadcast(deployerPk);

        // 1. AurexSignalRegistry
        AurexSignalRegistry registry = new AurexSignalRegistry(MOCK_AUREX, POOL_MANAGER, 100 * 1e18);
        console.log("[1/4] AurexSignalRegistry:", address(registry));

        // 2. AurexPolicyManager
        AurexPolicyManager policy = new AurexPolicyManager();
        console.log("[2/4] AurexPolicyManager: ", address(policy));

        vm.stopBroadcast();

        // 3. AurexAlphaHook (CREATE2 with mined salt)
        bytes memory hookInitCode = abi.encodePacked(
            type(AurexAlphaHook).creationCode,
            abi.encode(POOL_MANAGER, address(registry), address(policy))
        );
        bytes32 hookInitCodeHash = keccak256(hookInitCode);

        uint160 requiredFlags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG | Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG);
        uint160 flagMask = uint160(0x3FFF);

        bytes32 hookSalt;
        address hookAddress;
        bool found = false;
        console.log("");
        console.log("Mining hook salt (BEFORE_SWAP | AFTER_SWAP | AFTER_SWAP_RETURNS_DELTA)...");

        for (uint256 i = 0; i < 5_000_000; i++) {
            hookSalt = bytes32(i);
            hookAddress = address(uint160(uint256(keccak256(abi.encodePacked(
                bytes1(0xff), CREATE2_DEPLOYER, hookSalt, hookInitCodeHash
            )))));
            if (uint160(hookAddress) & flagMask == requiredFlags) {
                found = true;
                console.log("Found salt:", i);
                break;
            }
        }
        require(found, "Failed to mine hook salt");

        vm.startBroadcast(deployerPk);

        bytes memory hookPayload = abi.encodePacked(hookSalt, hookInitCode);
        (bool success,) = CREATE2_DEPLOYER.call(hookPayload);
        require(success, "Hook CREATE2 failed");

        uint256 codeSize;
        assembly { codeSize := extcodesize(hookAddress) }
        require(codeSize > 0, "Hook not deployed");
        console.log("[3/4] AurexAlphaHook:     ", hookAddress);

        // 4. AurexPoolFactory
        AurexPoolFactory factory = new AurexPoolFactory(
            POOL_MANAGER,
            address(policy),
            address(registry),
            hookAddress
        );
        console.log("[4/4] AurexPoolFactory:   ", address(factory));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("Save these addresses:");
        console.log("");
        console.log("SIGNAL_REGISTRY=", address(registry));
        console.log("POLICY_MANAGER= ", address(policy));
        console.log("ALPHA_HOOK=     ", hookAddress);
        console.log("POOL_FACTORY=   ", address(factory));
    }
}
