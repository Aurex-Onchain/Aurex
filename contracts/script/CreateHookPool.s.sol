// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {PoolPolicy} from "../src/libraries/AurexTypes.sol";

contract CreateHookPool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS");
        address hookAddress = vm.envAddress("HOOK_ADDRESS");
        address token0Address = vm.envAddress("TOKEN0_ADDRESS");
        address token1Address = vm.envAddress("TOKEN1_ADDRESS");
        address policyManagerAddress = vm.envAddress("POLICY_MANAGER_ADDRESS");

        // Ensure token0 < token1 (V4 requirement)
        require(token0Address < token1Address, "token0 must be < token1");

        vm.startBroadcast(deployerPrivateKey);

        IPoolManager poolManager = IPoolManager(poolManagerAddress);

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(token0Address),
            currency1: Currency.wrap(token1Address),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(hookAddress)
        });

        // Initialize at 1:1 price
        uint160 sqrtPriceX96 = 79228162514264337593543950336;
        poolManager.initialize(poolKey, sqrtPriceX96);

        bytes32 poolId = keccak256(abi.encode(poolKey));
        console.log("Pool initialized. PoolId:");
        console.logBytes32(poolId);

        // Set default policy for the pool
        AurexPolicyManager policyManager = AurexPolicyManager(policyManagerAddress);
        PoolPolicy memory policy = PoolPolicy({
            maxRiskScore: 75,
            minLiquidityScore: 20,
            defaultFee: 3000,    // 0.3%
            maxFee: 10000,       // 1%
            publisherShareBps: 500, // 5% of fee to publisher
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            useWeightedSignal: false,
            policyAdmin: vm.addr(deployerPrivateKey)
        });
        policyManager.setPolicy(poolId, policy);
        console.log("Policy set for pool");

        vm.stopBroadcast();
    }
}
