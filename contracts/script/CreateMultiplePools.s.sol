// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {PoolPolicy} from "../src/libraries/AurexTypes.sol";

contract CreateMultiplePools is Script {
    address constant WETH = 0x5A77f1443D16ee5761d310e38b62f77f726bC71c;
    address constant USDC = 0x74b7F16337b8972027F6196A17a631aC6dE26d22;
    address constant WBTC = 0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1;
    address constant USDT = 0x1E4a5963aBFD975d8c9021ce480b42188849D41d;
    address constant WOKB = 0xe538905cf8410324e03A5A23C1c177a474D59b2b;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolManagerAddr = vm.envAddress("POOL_MANAGER_ADDRESS");
        address hookAddr = vm.envAddress("HOOK_ADDRESS");
        address policyAddr = vm.envAddress("POLICY_MANAGER_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        IPoolManager pm = IPoolManager(poolManagerAddr);
        AurexPolicyManager policy = AurexPolicyManager(policyAddr);

        _createPool(pm, policy, WETH, USDC, hookAddr, deployer, 4339505055700000000000000, 80, 15, 3000, 10000);
        _createPool(pm, policy, USDC, WBTC, hookAddr, deployer, 30620000000000000000000000, 75, 20, 2500, 8000);
        _createPool(pm, policy, USDT, WETH, hookAddr, deployer, 1447000000000000000000000000000000, 80, 15, 3000, 10000);
        _createPool(pm, policy, USDC, WOKB, hookAddr, deployer, 11200000000000000000000000000000000, 70, 25, 3000, 12000);

        vm.stopBroadcast();
        console.log("\n=== All 4 Pools Created ===");
    }

    function _createPool(
        IPoolManager pm,
        AurexPolicyManager policyMgr,
        address token0,
        address token1,
        address hook,
        address admin,
        uint160 sqrtPriceX96,
        uint256 maxRisk,
        uint256 minLiq,
        uint24 defaultFee,
        uint24 maxFee
    ) internal {
        require(token0 < token1, "token0 must be < token1");

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(hook)
        });

        pm.initialize(key, sqrtPriceX96);
        bytes32 poolId = keccak256(abi.encode(key));
        console.log("Pool initialized:");
        console.logBytes32(poolId);

        policyMgr.setPolicy(poolId, PoolPolicy({
            maxRiskScore: maxRisk,
            minLiquidityScore: minLiq,
            defaultFee: defaultFee,
            maxFee: maxFee,
            publisherShareBps: 500,
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            policyAdmin: admin
        }));
    }
}
