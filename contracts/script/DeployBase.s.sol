// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {MockAUREX} from "../src/tokens/MockAUREX.sol";
import {MockUSDC} from "../src/tokens/MockUSDC.sol";

contract DeployBase is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolManagerAddr = vm.envAddress("POOL_MANAGER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        MockAUREX aurexToken = new MockAUREX();
        console.log("MockAUREX:", address(aurexToken));

        MockUSDC usdcToken = new MockUSDC();
        console.log("MockUSDC:", address(usdcToken));

        uint256 minStake = 100 * 1e18;
        AurexSignalRegistry signalRegistry = new AurexSignalRegistry(
            address(aurexToken),
            poolManagerAddr,
            minStake
        );
        console.log("AurexSignalRegistry:", address(signalRegistry));

        AurexPolicyManager policyManager = new AurexPolicyManager();
        console.log("AurexPolicyManager:", address(policyManager));

        // Register deployer as publisher by staking
        address deployer = vm.addr(deployerPrivateKey);
        aurexToken.approve(address(signalRegistry), minStake);
        signalRegistry.registerPublisher(minStake);
        console.log("Publisher registered:", deployer);

        vm.stopBroadcast();
    }
}
