// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexSignal} from "../src/libraries/AurexTypes.sol";

contract RegisterAndPublish is Script {
    function run() external {
        uint256 publisherPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address registryAddress = vm.envAddress("SIGNAL_REGISTRY_ADDRESS");
        address stakeTokenAddress = vm.envAddress("TOKEN1_ADDRESS");
        address publisher = vm.addr(publisherPrivateKey);

        AurexSignalRegistry registry = AurexSignalRegistry(registryAddress);
        IERC20 stakeToken = IERC20(stakeTokenAddress);

        vm.startBroadcast(publisherPrivateKey);

        uint256 stakeAmount = 100 * 1e18;
        stakeToken.approve(registryAddress, stakeAmount);
        registry.registerPublisher(stakeAmount);
        console.log("Publisher registered:", publisher);
        console.log("Stake amount:", stakeAmount);

        bytes32 poolWETH_USDC = 0x04e9effc458bfd24b03b19aa526dbccee03b83001dcee5895aa12bdb7deeb57d;
        bytes32 poolUSDC_WBTC = 0x6d79dfd7f52ea40736f8d2a62e9335c23fd9d6a0032de76283f5e8d646cfb759;
        bytes32 poolUSDT_WETH = 0x86e8639d2a670d6062c5d18de278e9d7b27ebda30c6fa60b662c743adec6d043;
        bytes32 poolUSDC_WOKB = 0x26557499cc8c660efebddad4483b540493bdcc7c0c6b208a3b3c6ef6a56b5ae3;

        uint64 expiry = uint64(block.timestamp + 2 hours);

        registry.publishSignal(AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, poolWETH_USDC, "eth-breakout")),
            poolId: poolWETH_USDC,
            riskScore: 42,
            alphaScore: 81,
            liquidityScore: 90,
            volatilityScore: 55,
            recommendedFee: 2000,
            expiresAt: expiry,
            signer: publisher
        }));
        console.log("Signal 1 published (WETH/USDC)");

        registry.publishSignal(AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, poolUSDC_WBTC, "btc-consolidation")),
            poolId: poolUSDC_WBTC,
            riskScore: 28,
            alphaScore: 55,
            liquidityScore: 95,
            volatilityScore: 30,
            recommendedFee: 1500,
            expiresAt: expiry,
            signer: publisher
        }));
        console.log("Signal 2 published (USDC/WBTC)");

        registry.publishSignal(AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, poolUSDT_WETH, "volume-anomaly")),
            poolId: poolUSDT_WETH,
            riskScore: 72,
            alphaScore: 35,
            liquidityScore: 60,
            volatilityScore: 85,
            recommendedFee: 7500,
            expiresAt: expiry,
            signer: publisher
        }));
        console.log("Signal 3 published (USDT/WETH)");

        registry.publishSignal(AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, poolUSDC_WOKB, "okb-growth")),
            poolId: poolUSDC_WOKB,
            riskScore: 30,
            alphaScore: 78,
            liquidityScore: 70,
            volatilityScore: 40,
            recommendedFee: 2000,
            expiresAt: expiry,
            signer: publisher
        }));
        console.log("Signal 4 published (USDC/WOKB)");

        vm.stopBroadcast();
        console.log("\n=== Publisher Registered + 4 Signals Published ===");
    }
}
