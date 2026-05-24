// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {AurexPolicyManager} from "../policy/AurexPolicyManager.sol";
import {IAurexSignalRegistry} from "../interfaces/IAurexSignalRegistry.sol";
import {PoolPolicy} from "../libraries/AurexTypes.sol";

contract AurexPoolFactory {
    IPoolManager public immutable poolManager;
    AurexPolicyManager public immutable policyManager;
    IAurexSignalRegistry public immutable signalRegistry;
    address public immutable hook;

    event PoolCreated(
        bytes32 indexed poolId,
        address indexed creator,
        address token0,
        address token1,
        int24 tickSpacing
    );

    constructor(address _poolManager, address _policyManager, address _signalRegistry, address _hook) {
        poolManager = IPoolManager(_poolManager);
        policyManager = AurexPolicyManager(_policyManager);
        signalRegistry = IAurexSignalRegistry(_signalRegistry);
        hook = _hook;
    }

    function createPool(
        address token0,
        address token1,
        int24 tickSpacing,
        uint160 sqrtPriceX96,
        PoolPolicy calldata policy
    ) external returns (bytes32) {
        require(token0 < token1, "token0 must be < token1");
        require(policy.policyAdmin == msg.sender, "Admin must be caller");

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: tickSpacing,
            hooks: IHooks(hook)
        });

        poolManager.initialize(key, sqrtPriceX96);
        bytes32 poolId = keccak256(abi.encode(key));

        policyManager.setPolicy(poolId, policy);
        signalRegistry.registerPoolKey(poolId, key);

        emit PoolCreated(poolId, msg.sender, token0, token1, tickSpacing);
        return poolId;
    }
}
