// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {AurexAlphaHook} from "../src/hooks/AurexAlphaHook.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {AurexSignal, PoolPolicy} from "../src/libraries/AurexTypes.sol";
import {MockAUREX} from "../src/tokens/MockAUREX.sol";
import {MockUSDC} from "../src/tokens/MockUSDC.sol";

contract AurexAlphaHookTest is Test {
    PoolManager poolManager;
    AurexAlphaHook hook;
    AurexSignalRegistry signalRegistry;
    AurexPolicyManager policyManager;
    PoolSwapTest swapRouter;

    MockAUREX aurex;
    MockUSDC usdc;

    PoolKey poolKey;
    bytes32 poolId;

    address publisher = address(0xAA);
    address trader = address(0xBB);
    address admin = address(0xCC);

    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    function setUp() public {
        poolManager = new PoolManager(address(this));

        aurex = new MockAUREX();
        usdc = new MockUSDC();

        uint256 minStake = 100 ether;
        signalRegistry = new AurexSignalRegistry(address(aurex), address(poolManager), minStake);
        policyManager = new AurexPolicyManager();

        // Register publisher by staking
        aurex.mint(publisher, minStake);
        vm.startPrank(publisher);
        aurex.approve(address(signalRegistry), minStake);
        signalRegistry.registerPublisher(minStake);
        vm.stopPrank();

        // Deploy hook at an address with correct flags (beforeSwap + afterSwap + afterSwapReturnDelta)
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG | Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG);
        address hookAddress = address(flags);

        deployCodeTo(
            "AurexAlphaHook.sol",
            abi.encode(address(poolManager), address(signalRegistry), address(policyManager)),
            hookAddress
        );
        hook = AurexAlphaHook(hookAddress);

        swapRouter = new PoolSwapTest(poolManager);

        // Sort currencies (V4 requires currency0 < currency1)
        Currency currency0;
        Currency currency1;
        if (address(aurex) < address(usdc)) {
            currency0 = Currency.wrap(address(aurex));
            currency1 = Currency.wrap(address(usdc));
        } else {
            currency0 = Currency.wrap(address(usdc));
            currency1 = Currency.wrap(address(aurex));
        }

        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(hookAddress)
        });

        poolId = keccak256(abi.encode(poolKey));

        // Initialize pool
        poolManager.initialize(poolKey, SQRT_PRICE_1_1);

        // Set up policy
        PoolPolicy memory policy = PoolPolicy({
            maxRiskScore: 70,
            minLiquidityScore: 20,
            defaultFee: 3000,
            maxFee: 10000,
            publisherShareBps: 500,
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            useWeightedSignal: false,
            policyAdmin: admin
        });
        policyManager.setPolicy(poolId, policy);

        // Fund trader
        aurex.mint(trader, 1_000_000 ether);
        usdc.mint(trader, 1_000_000 * 10 ** 6);

        // Approve router
        vm.startPrank(trader);
        aurex.approve(address(swapRouter), type(uint256).max);
        usdc.approve(address(swapRouter), type(uint256).max);
        vm.stopPrank();

        // Add liquidity (use this contract as LP)
        aurex.mint(address(this), 100_000 ether);
        usdc.mint(address(this), 100_000 * 10 ** 6);
        aurex.approve(address(poolManager), type(uint256).max);
        usdc.approve(address(poolManager), type(uint256).max);
    }

    function _publishSignal(uint256 riskScore, uint256 alphaScore, uint24 recommendedFee) internal {
        AurexSignal memory signal = AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, riskScore)),
            poolId: poolId,
            riskScore: riskScore,
            alphaScore: alphaScore,
            liquidityScore: 70,
            volatilityScore: 30,
            recommendedFee: recommendedFee,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        vm.prank(publisher);
        signalRegistry.publishSignal(signal);
    }

    function test_hookPermissions() public view {
        Hooks.Permissions memory perms = hook.getHookPermissions();
        assertTrue(perms.beforeSwap);
        assertTrue(perms.afterSwap);
        assertFalse(perms.beforeInitialize);
        assertFalse(perms.beforeAddLiquidity);
    }

    function test_computeDynamicFee_lowRisk() public view {
        AurexSignal memory signal = AurexSignal({
            signalId: bytes32(0),
            poolId: poolId,
            riskScore: 20,
            alphaScore: 80,
            liquidityScore: 70,
            volatilityScore: 30,
            recommendedFee: 0,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        PoolPolicy memory policy = PoolPolicy({
            maxRiskScore: 70,
            minLiquidityScore: 20,
            defaultFee: 3000,
            maxFee: 10000,
            publisherShareBps: 500,
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            useWeightedSignal: false,
            policyAdmin: admin
        });

        // fee = 3000 + (10000 - 3000) * 20 / 100 = 3000 + 1400 = 4400
        uint24 fee = hook.computeDynamicFee(signal, policy);
        assertEq(fee, 4400);
    }

    function test_computeDynamicFee_highRisk() public view {
        AurexSignal memory signal = AurexSignal({
            signalId: bytes32(0),
            poolId: poolId,
            riskScore: 90,
            alphaScore: 20,
            liquidityScore: 30,
            volatilityScore: 80,
            recommendedFee: 0,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        PoolPolicy memory policy = PoolPolicy({
            maxRiskScore: 70,
            minLiquidityScore: 20,
            defaultFee: 3000,
            maxFee: 10000,
            publisherShareBps: 500,
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            useWeightedSignal: false,
            policyAdmin: admin
        });

        // fee = 3000 + (10000 - 3000) * 90 / 100 = 3000 + 6300 = 9300
        uint24 fee = hook.computeDynamicFee(signal, policy);
        assertEq(fee, 9300);
    }

    function test_computeDynamicFee_usesRecommendedIfValid() public view {
        AurexSignal memory signal = AurexSignal({
            signalId: bytes32(0),
            poolId: poolId,
            riskScore: 50,
            alphaScore: 50,
            liquidityScore: 50,
            volatilityScore: 50,
            recommendedFee: 5000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        PoolPolicy memory policy = PoolPolicy({
            maxRiskScore: 70,
            minLiquidityScore: 20,
            defaultFee: 3000,
            maxFee: 10000,
            publisherShareBps: 500,
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            useWeightedSignal: false,
            policyAdmin: admin
        });

        uint24 fee = hook.computeDynamicFee(signal, policy);
        assertEq(fee, 5000);
    }

    function test_signalCountTracking() public {
        _publishSignal(30, 70, 3000);
        assertEq(signalRegistry.getSignalCount(poolId), 1);

        _publishSignal(40, 60, 4000);
        assertEq(signalRegistry.getSignalCount(poolId), 2);
    }

    function test_batchSignalQuery() public {
        bytes32 poolId2 = keccak256("pool-2");

        AurexSignal memory signal1 = AurexSignal({
            signalId: keccak256("s1"),
            poolId: poolId,
            riskScore: 30,
            alphaScore: 70,
            liquidityScore: 80,
            volatilityScore: 20,
            recommendedFee: 3000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        AurexSignal memory signal2 = AurexSignal({
            signalId: keccak256("s2"),
            poolId: poolId2,
            riskScore: 60,
            alphaScore: 40,
            liquidityScore: 50,
            volatilityScore: 50,
            recommendedFee: 7000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        vm.startPrank(publisher);
        signalRegistry.publishSignal(signal1);
        signalRegistry.publishSignal(signal2);
        vm.stopPrank();

        bytes32[] memory ids = new bytes32[](2);
        ids[0] = poolId;
        ids[1] = poolId2;

        AurexSignal[] memory signals = signalRegistry.getSignalsByPool(ids);
        assertEq(signals.length, 2);
        assertEq(signals[0].riskScore, 30);
        assertEq(signals[1].riskScore, 60);
    }

    function test_revenueShare_creditsPublisher() public {
        _publishSignal(30, 70, 3000);

        // Simulate afterSwap call from poolManager
        // zeroForOne swap: output is token1 (negative delta means pool pays out)
        int128 amount0 = int128(int256(1 ether));
        int128 amount1 = -int128(int256(1 ether));
        BalanceDelta delta = BalanceDelta.wrap(
            (int256(amount0) << 128) | int256(uint256(uint128(uint128(amount1))))
        );

        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -1 ether,
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });

        vm.prank(address(poolManager));
        (, int128 hookDelta) = hook.afterSwap(trader, poolKey, params, delta, "");

        // publisherShareBps = 500 (5%), output = 1 ether
        // publisherShare = 1 ether * 500 / 10000 = 0.05 ether
        uint256 expectedShare = 1 ether * 500 / 10000;
        assertEq(uint128(hookDelta), expectedShare);

        address outputToken = Currency.unwrap(poolKey.currency1);
        assertEq(hook.getClaimable(publisher, outputToken), expectedShare);
    }

    function test_revenueShare_zeroWhenNoSignal() public {
        // No signal published — signer is address(0)
        int128 amount0 = int128(int256(1 ether));
        int128 amount1 = -int128(int256(1 ether));
        BalanceDelta delta = BalanceDelta.wrap(
            (int256(amount0) << 128) | int256(uint256(uint128(uint128(amount1))))
        );

        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -1 ether,
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });

        vm.prank(address(poolManager));
        (, int128 hookDelta) = hook.afterSwap(trader, poolKey, params, delta, "");

        assertEq(hookDelta, 0);
    }

    function test_revenueShare_zeroWhenShareBpsZero() public {
        _publishSignal(30, 70, 3000);

        // Update policy to 0 publisher share
        PoolPolicy memory policy = PoolPolicy({
            maxRiskScore: 70,
            minLiquidityScore: 20,
            defaultFee: 3000,
            maxFee: 10000,
            publisherShareBps: 0,
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            useWeightedSignal: false,
            policyAdmin: admin
        });
        vm.prank(admin);
        policyManager.setPolicy(poolId, policy);

        int128 amount0 = int128(int256(1 ether));
        int128 amount1 = -int128(int256(1 ether));
        BalanceDelta delta = BalanceDelta.wrap(
            (int256(amount0) << 128) | int256(uint256(uint128(uint128(amount1))))
        );

        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -1 ether,
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });

        vm.prank(address(poolManager));
        (, int128 hookDelta) = hook.afterSwap(trader, poolKey, params, delta, "");

        assertEq(hookDelta, 0);
    }

    function test_proofOfAlpha_emitted() public {
        _publishSignal(30, 70, 3000);

        int128 amount0 = int128(int256(1 ether));
        int128 amount1 = -int128(int256(1 ether));
        BalanceDelta delta = BalanceDelta.wrap(
            (int256(amount0) << 128) | int256(uint256(uint128(uint128(amount1))))
        );

        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -1 ether,
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });

        // First call beforeSwap to set _lastAppliedFee
        vm.prank(address(poolManager));
        hook.beforeSwap(trader, poolKey, params, "");

        uint256 expectedShare = 1 ether * 500 / 10000;
        bytes32 signalId = signalRegistry.getLatestSignal(poolId).signalId;

        vm.expectEmit(true, true, false, true);
        emit AurexAlphaHook.ProofOfAlpha(
            poolId,
            trader,
            signalId,
            publisher,
            3000,
            expectedShare
        );

        vm.prank(address(poolManager));
        hook.afterSwap(trader, poolKey, params, delta, "");
    }
}