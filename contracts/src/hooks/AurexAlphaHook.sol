// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IAurexSignalRegistry} from "../interfaces/IAurexSignalRegistry.sol";
import {IAurexPolicyManager} from "../interfaces/IAurexPolicyManager.sol";
import {AurexSignal, PoolPolicy} from "../libraries/AurexTypes.sol";

contract AurexAlphaHook is IHooks {
    using LPFeeLibrary for uint24;

    IPoolManager public immutable poolManager;
    IAurexSignalRegistry public immutable signalRegistry;
    IAurexPolicyManager public immutable policyManager;

    uint256 public totalSwapsProcessed;
    uint256 public totalSwapsBlocked;

    // Fee revenue share: publisher => token => claimable amount
    mapping(address => mapping(address => uint256)) public claimable;

    // Track the fee applied in beforeSwap for use in afterSwap's ProofOfAlpha event
    mapping(bytes32 => uint24) internal _lastAppliedFee;

    event AurexSwapChecked(
        bytes32 indexed poolId,
        address indexed sender,
        bytes32 indexed signalId,
        uint256 riskScore,
        uint256 alphaScore,
        uint24 appliedFee,
        bool blocked
    );

    event AurexAlphaExecuted(
        bytes32 indexed poolId,
        address indexed sender,
        bytes32 indexed signalId,
        int256 amount0Delta,
        int256 amount1Delta,
        uint256 riskScore,
        uint256 alphaScore
    );

    event ProofOfAlpha(
        bytes32 indexed poolId,
        address indexed trader,
        bytes32 signalId,
        address signalPublisher,
        uint24 feeApplied,
        uint256 publisherRevenue
    );

    event FeesClaimed(address indexed publisher, address indexed token, uint256 amount);
    event RevenueShared(bytes32 indexed poolId, address indexed publisher, address token, uint256 amount);

    modifier onlyPoolManager() {
        require(msg.sender == address(poolManager), "Not pool manager");
        _;
    }

    constructor(
        IPoolManager _poolManager,
        IAurexSignalRegistry _signalRegistry,
        IAurexPolicyManager _policyManager
    ) {
        poolManager = _poolManager;
        signalRegistry = _signalRegistry;
        policyManager = _policyManager;
    }

    function getHookPermissions() public pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: true,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    /// @notice Compute dynamic fee based on risk score and policy bounds.
    /// Low risk → lower fee (reward), high risk → higher fee (penalty).
    function computeDynamicFee(
        AurexSignal memory signal,
        PoolPolicy memory policy
    ) public pure returns (uint24) {
        if (signal.recommendedFee > 0 && signal.recommendedFee <= policy.maxFee) {
            return signal.recommendedFee;
        }
        // Linear interpolation: fee = defaultFee + (maxFee - defaultFee) * riskScore / 100
        uint24 feeRange = policy.maxFee - policy.defaultFee;
        uint24 riskPremium = uint24((uint256(feeRange) * signal.riskScore) / 100);
        return policy.defaultFee + riskPremium;
    }

    function beforeInitialize(address, PoolKey calldata, uint160) external pure returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.beforeAddLiquidity.selector;
    }

    function afterAddLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata
    ) external onlyPoolManager returns (bytes4, BeforeSwapDelta, uint24) {
        bytes32 poolId = keccak256(abi.encode(key));

        AurexSignal memory signal = signalRegistry.getLatestSignal(poolId);
        PoolPolicy memory policy = policyManager.getPolicy(poolId);

        uint24 fee = policy.defaultFee;
        bool blocked = false;

        if (signalRegistry.isSignalValid(poolId)) {
            // Check if weighted signal mode is enabled and multiple signals exist
            if (policy.useWeightedSignal) {
                (uint256 wRisk, , uint24 wFee, uint256 wTotal) = signalRegistry.getWeightedSignal(poolId);
                if (wTotal > 0) {
                    // Use weighted values for risk check and fee
                    if (policy.blockHighRiskTrades && wRisk > policy.maxRiskScore) {
                        blocked = true;
                        totalSwapsBlocked++;
                    }
                    if (wFee > 0 && wFee <= policy.maxFee) {
                        fee = wFee;
                    } else {
                        uint24 feeRange = policy.maxFee - policy.defaultFee;
                        uint24 riskPremium = uint24((uint256(feeRange) * wRisk) / 100);
                        fee = policy.defaultFee + riskPremium;
                    }
                } else {
                    // Fallback to single signal
                    if (policy.blockHighRiskTrades && signal.riskScore > policy.maxRiskScore) {
                        blocked = true;
                        totalSwapsBlocked++;
                    }
                    fee = computeDynamicFee(signal, policy);
                }
            } else {
                // Single signal mode (original behavior)
                if (policy.blockHighRiskTrades && signal.riskScore > policy.maxRiskScore) {
                    blocked = true;
                    totalSwapsBlocked++;
                }
                fee = computeDynamicFee(signal, policy);
            }
        } else if (!policy.allowSwapWhenSignalExpired) {
            // No valid signal and policy disallows expired-signal swaps: use max fee as penalty
            fee = policy.maxFee;
        }
        // else: no valid signal but policy allows it: use defaultFee

        totalSwapsProcessed++;

        emit AurexSwapChecked(poolId, sender, signal.signalId, signal.riskScore, signal.alphaScore, fee, blocked);

        require(!blocked, "Aurex: trade blocked by risk policy");

        _lastAppliedFee[poolId] = fee;

        uint24 feeWithFlag = fee | LPFeeLibrary.OVERRIDE_FEE_FLAG;
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, feeWithFlag);
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) external onlyPoolManager returns (bytes4, int128) {
        bytes32 pid = keccak256(abi.encode(key));
        AurexSignal memory signal = signalRegistry.getLatestSignal(pid);

        emit AurexAlphaExecuted(
            pid,
            sender,
            signal.signalId,
            int256(delta.amount0()),
            int256(delta.amount1()),
            signal.riskScore,
            signal.alphaScore
        );

        if (signal.signer == address(0) || !signalRegistry.isSignalValid(pid)) {
            return (IHooks.afterSwap.selector, 0);
        }

        PoolPolicy memory policy = policyManager.getPolicy(pid);
        if (policy.publisherShareBps == 0) {
            return (IHooks.afterSwap.selector, 0);
        }

        // Determine the output token and amount
        // For exactInput: zeroForOne means output is token1 (delta.amount1 < 0 means pool pays out)
        // For exactOutput: similar logic
        int128 outputAmount;
        address outputToken;
        if (params.zeroForOne) {
            outputAmount = delta.amount1();
            outputToken = Currency.unwrap(key.currency1);
        } else {
            outputAmount = delta.amount0();
            outputToken = Currency.unwrap(key.currency0);
        }

        // Output from pool perspective is negative (pool pays trader)
        // We take a share of the absolute output
        if (outputAmount >= 0) {
            return (IHooks.afterSwap.selector, 0);
        }

        uint128 absOutput = uint128(-outputAmount);
        uint128 publisherShare = (absOutput * policy.publisherShareBps) / 10000;

        if (publisherShare == 0) {
            return (IHooks.afterSwap.selector, 0);
        }

        claimable[signal.signer][outputToken] += publisherShare;
        emit RevenueShared(pid, signal.signer, outputToken, publisherShare);

        emit ProofOfAlpha(
            pid,
            sender,
            signal.signalId,
            signal.signer,
            _lastAppliedFee[pid],
            publisherShare
        );

        // Return positive delta = hook takes from the swap output
        return (IHooks.afterSwap.selector, int128(uint128(publisherShare)));
    }

    function claimFees(address token) external {
        uint256 amount = claimable[msg.sender][token];
        require(amount > 0, "Nothing to claim");
        claimable[msg.sender][token] = 0;
        poolManager.take(Currency.wrap(token), msg.sender, amount);
        emit FeesClaimed(msg.sender, token, amount);
    }

    function getClaimable(address publisher, address token) external view returns (uint256) {
        return claimable[publisher][token];
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.afterDonate.selector;
    }
}