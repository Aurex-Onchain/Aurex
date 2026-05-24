// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexSignal} from "../src/libraries/AurexTypes.sol";

contract PublishSignal is Script {
    function run() external {
        uint256 publisherPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address registryAddress = vm.envAddress("SIGNAL_REGISTRY_ADDRESS");
        bytes32 poolId = vm.envBytes32("POOL_ID");

        address publisher = vm.addr(publisherPrivateKey);

        vm.startBroadcast(publisherPrivateKey);

        AurexSignalRegistry registry = AurexSignalRegistry(registryAddress);

        AurexSignal memory signal = AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, poolId, "aurex-signal")),
            poolId: poolId,
            riskScore: 35,
            alphaScore: 72,
            liquidityScore: 80,
            volatilityScore: 25,
            recommendedFee: 2500,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        registry.publishSignal(signal);

        console.log("Signal published successfully");
        console.log("Signal ID:");
        console.logBytes32(signal.signalId);
        console.log("Risk Score:", signal.riskScore);
        console.log("Alpha Score:", signal.alphaScore);
        console.log("Recommended Fee:", signal.recommendedFee);
        console.log("Expires At:", signal.expiresAt);

        vm.stopBroadcast();
    }
}
