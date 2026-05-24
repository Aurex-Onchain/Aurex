// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {AurexAlphaHook} from "../src/hooks/AurexAlphaHook.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {MockAUREX} from "../src/tokens/MockAUREX.sol";
import {MockUSDC} from "../src/tokens/MockUSDC.sol";

import {IAurexSignalRegistry} from "../src/interfaces/IAurexSignalRegistry.sol";
import {IAurexPolicyManager} from "../src/interfaces/IAurexPolicyManager.sol";

contract DeployXLayer is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Tokens
        MockAUREX aurexToken = new MockAUREX();
        console.log("MockAUREX:", address(aurexToken));

        MockUSDC usdcToken = new MockUSDC();
        console.log("MockUSDC:", address(usdcToken));

        // 2. Deploy Signal Registry (stake-to-publish model)
        uint256 minStake = 100 * 1e18;
        AurexSignalRegistry signalRegistry = new AurexSignalRegistry(
            address(aurexToken),
            poolManagerAddress,
            minStake
        );
        console.log("AurexSignalRegistry:", address(signalRegistry));

        // 3. Deploy Policy Manager
        AurexPolicyManager policyManager = new AurexPolicyManager();
        console.log("AurexPolicyManager:", address(policyManager));

        // 4. Deploy Hook (requires CREATE2 for correct address flags)
        AurexAlphaHook hook = new AurexAlphaHook(
            IPoolManager(poolManagerAddress),
            IAurexSignalRegistry(address(signalRegistry)),
            IAurexPolicyManager(address(policyManager))
        );
        console.log("AurexAlphaHook:", address(hook));

        // 5. Register deployer as publisher by staking AUREX
        aurexToken.approve(address(signalRegistry), minStake);
        signalRegistry.registerPublisher(minStake);
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Publisher registered:", deployer);

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Chain: X Layer Mainnet (196)");
        console.log("SignalRegistry:", address(signalRegistry));
        console.log("PolicyManager:", address(policyManager));
        console.log("Hook:", address(hook));
        console.log("AUREX Token:", address(aurexToken));
        console.log("USDC Token:", address(usdcToken));
    }
}
