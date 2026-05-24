// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {AurexPoolFactory} from "../src/factory/AurexPoolFactory.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolManagerAddr = vm.envAddress("POOL_MANAGER_ADDRESS");
        address policyManagerAddr = vm.envAddress("POLICY_MANAGER_ADDRESS");
        address signalRegistryAddr = vm.envAddress("SIGNAL_REGISTRY_ADDRESS");
        address hookAddr = vm.envAddress("HOOK_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        AurexPoolFactory factory = new AurexPoolFactory(poolManagerAddr, policyManagerAddr, signalRegistryAddr, hookAddr);
        console.log("AurexPoolFactory:", address(factory));

        vm.stopBroadcast();
    }
}
