// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {AurexSignal, PublisherInfo, SignalRecord, PoolPolicy} from "../src/libraries/AurexTypes.sol";
import {MockAUREX} from "../src/tokens/MockAUREX.sol";
import {MockUSDC} from "../src/tokens/MockUSDC.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";

contract AurexSignalRegistryTest is Test {
    AurexSignalRegistry registry;
    AurexPolicyManager policyManager;
    MockAUREX stakeToken;
    MockUSDC usdc;
    PoolManager poolManager;

    PoolKey poolKey;
    bytes32 poolId;

    address publisher = address(0x1);
    address publisher2 = address(0x2);
    address admin = address(0xCC);
    uint256 minStake = 100 ether;

    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    function setUp() public {
        stakeToken = new MockAUREX();
        usdc = new MockUSDC();
        poolManager = new PoolManager(address(this));
        policyManager = new AurexPolicyManager();
        registry = new AurexSignalRegistry(address(stakeToken), address(poolManager), minStake);
        registry.setPolicyManager(address(policyManager));

        stakeToken.mint(publisher, 1000 ether);
        stakeToken.mint(publisher2, 1000 ether);

        vm.startPrank(publisher);
        stakeToken.approve(address(registry), type(uint256).max);
        registry.registerPublisher(minStake);
        vm.stopPrank();

        // Create a real pool for verification tests
        Currency currency0;
        Currency currency1;
        if (address(stakeToken) < address(usdc)) {
            currency0 = Currency.wrap(address(stakeToken));
            currency1 = Currency.wrap(address(usdc));
        } else {
            currency0 = Currency.wrap(address(usdc));
            currency1 = Currency.wrap(address(stakeToken));
        }

        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        poolId = keccak256(abi.encode(poolKey));
        poolManager.initialize(poolKey, SQRT_PRICE_1_1);
        registry.registerPoolKey(poolId, poolKey);

        policyManager.setPolicy(poolId, PoolPolicy({
            maxRiskScore: 80,
            minLiquidityScore: 20,
            defaultFee: 3000,
            maxFee: 10000,
            publisherShareBps: 500,
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            policyAdmin: admin
        }));
    }

    function test_registerPublisher() public view {
        PublisherInfo memory info = registry.getPublisherInfo(publisher);
        assertEq(info.stakeAmount, minStake);
        assertTrue(info.active);
        assertEq(info.accuracyScore, 50);
        assertEq(registry.getPublisherCount(), 1);
    }

    function test_registerPublisher_belowMinStake() public {
        vm.startPrank(publisher2);
        stakeToken.approve(address(registry), type(uint256).max);
        vm.expectRevert("Below minimum stake");
        registry.registerPublisher(minStake - 1);
        vm.stopPrank();
    }

    function test_publishSignal() public {
        bytes32 testPoolId = keccak256("test-pool");
        AurexSignal memory signal = AurexSignal({
            signalId: keccak256("signal-1"),
            poolId: testPoolId,
            riskScore: 45,
            alphaScore: 72,
            liquidityScore: 80,
            volatilityScore: 30,
            recommendedFee: 3000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        vm.prank(publisher);
        registry.publishSignal(signal);

        AurexSignal memory stored = registry.getLatestSignal(testPoolId);
        assertEq(stored.riskScore, 45);
        assertEq(stored.alphaScore, 72);
        assertTrue(registry.isSignalValid(testPoolId));
        assertEq(registry.getSignalCount(testPoolId), 1);
    }

    function test_rejectUnregisteredPublisher() public {
        address unauthorized = address(0x99);
        AurexSignal memory signal = AurexSignal({
            signalId: keccak256("signal-2"),
            poolId: keccak256("pool"),
            riskScore: 50,
            alphaScore: 50,
            liquidityScore: 50,
            volatilityScore: 50,
            recommendedFee: 3000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: unauthorized
        });

        vm.prank(unauthorized);
        vm.expectRevert("Not active publisher");
        registry.publishSignal(signal);
    }

    function test_expiredSignalInvalid() public {
        bytes32 testPoolId2 = keccak256("test-pool-2");
        AurexSignal memory signal = AurexSignal({
            signalId: keccak256("signal-3"),
            poolId: testPoolId2,
            riskScore: 30,
            alphaScore: 60,
            liquidityScore: 70,
            volatilityScore: 20,
            recommendedFee: 2000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        vm.prank(publisher);
        registry.publishSignal(signal);

        vm.warp(block.timestamp + 2 hours);
        assertFalse(registry.isSignalValid(testPoolId2));
    }

    function test_unregisterPublisher() public {
        vm.warp(block.timestamp + 2 days);
        uint256 balBefore = stakeToken.balanceOf(publisher);

        vm.prank(publisher);
        registry.unregisterPublisher();

        PublisherInfo memory info = registry.getPublisherInfo(publisher);
        assertFalse(info.active);
        assertEq(info.stakeAmount, 0);
        assertEq(stakeToken.balanceOf(publisher), balBefore + minStake);
    }

    function test_unregisterPublisher_cooldownNotMet() public {
        vm.prank(publisher);
        vm.expectRevert("Cooldown not met");
        registry.unregisterPublisher();
    }

    function test_verifySignal_correctPrediction() public {
        bytes32 signalId = keccak256("verify-signal");

        AurexSignal memory signal = AurexSignal({
            signalId: signalId,
            poolId: poolId,
            riskScore: 30,
            alphaScore: 50,
            liquidityScore: 80,
            volatilityScore: 20,
            recommendedFee: 3000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        vm.prank(publisher);
        registry.publishSignal(signal);

        SignalRecord memory rec = registry.getSignalRecord(signalId);
        assertTrue(rec.priceAtPublish > 0, "priceAtPublish should be set from slot0");

        vm.warp(block.timestamp + 2 hours);

        // alphaScore=50 means predicted neutral/down, price unchanged → correct
        registry.verifySignal(signalId);

        SignalRecord memory record = registry.getSignalRecord(signalId);
        assertTrue(record.verified);
        assertFalse(record.slashed);
    }

    function test_increaseStake() public {
        uint256 additional = 50 ether;
        vm.prank(publisher);
        registry.increaseStake(additional);

        PublisherInfo memory info = registry.getPublisherInfo(publisher);
        assertEq(info.stakeAmount, minStake + additional);
    }

    function test_registerPoolKey_duplicateReverts() public {
        vm.expectRevert("Pool key already registered");
        registry.registerPoolKey(poolId, poolKey);
    }

    function test_registerPoolKey_mismatchReverts() public {
        bytes32 fakeId = keccak256("fake");
        vm.expectRevert("Pool key does not match poolId");
        registry.registerPoolKey(fakeId, poolKey);
    }

    function test_whitelist_blocksUnauthorizedPublisher() public {
        vm.startPrank(publisher2);
        stakeToken.approve(address(registry), type(uint256).max);
        registry.registerPublisher(minStake);
        vm.stopPrank();

        address[] memory allowed = new address[](1);
        allowed[0] = publisher;

        vm.prank(admin);
        registry.setAllowedPublishers(poolId, allowed);

        AurexSignal memory signal = AurexSignal({
            signalId: keccak256("wl-signal"),
            poolId: poolId,
            riskScore: 40,
            alphaScore: 60,
            liquidityScore: 70,
            volatilityScore: 25,
            recommendedFee: 3000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher2
        });

        vm.prank(publisher2);
        vm.expectRevert("Not allowed for this pool");
        registry.publishSignal(signal);
    }

    function test_whitelist_allowsAuthorizedPublisher() public {
        address[] memory allowed = new address[](1);
        allowed[0] = publisher;

        vm.prank(admin);
        registry.setAllowedPublishers(poolId, allowed);

        AurexSignal memory signal = AurexSignal({
            signalId: keccak256("wl-signal-ok"),
            poolId: poolId,
            riskScore: 40,
            alphaScore: 60,
            liquidityScore: 70,
            volatilityScore: 25,
            recommendedFee: 3000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        vm.prank(publisher);
        registry.publishSignal(signal);

        AurexSignal memory stored = registry.getLatestSignal(poolId);
        assertEq(stored.riskScore, 40);
    }

    function test_whitelist_removePublisher() public {
        address[] memory allowed = new address[](2);
        allowed[0] = publisher;
        allowed[1] = publisher2;

        vm.prank(admin);
        registry.setAllowedPublishers(poolId, allowed);

        vm.prank(admin);
        registry.removeAllowedPublisher(poolId, publisher);

        assertFalse(registry.isPublisherAllowed(poolId, publisher));
        assertTrue(registry.isPublisherAllowed(poolId, publisher2));
    }

    function test_verifySignal_slashOnWrongPrediction() public {
        bytes32 signalId = keccak256("slash-signal");

        // alphaScore=80 means predicted UP, but price won't change → wrong prediction
        AurexSignal memory signal = AurexSignal({
            signalId: signalId,
            poolId: poolId,
            riskScore: 30,
            alphaScore: 80,
            liquidityScore: 80,
            volatilityScore: 20,
            recommendedFee: 3000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        vm.prank(publisher);
        registry.publishSignal(signal);

        vm.warp(block.timestamp + 2 hours);

        uint256 stakeBefore = registry.getPublisherInfo(publisher).stakeAmount;
        registry.verifySignal(signalId);

        SignalRecord memory record = registry.getSignalRecord(signalId);
        assertTrue(record.verified);
        assertTrue(record.slashed);

        PublisherInfo memory info = registry.getPublisherInfo(publisher);
        assertLt(info.stakeAmount, stakeBefore);
        assertEq(info.slashCount, 1);
    }

    function test_getPublisherList() public {
        vm.startPrank(publisher2);
        stakeToken.approve(address(registry), type(uint256).max);
        registry.registerPublisher(minStake);
        vm.stopPrank();

        address[] memory list = registry.getPublisherList(0, 10);
        assertEq(list.length, 2);
        assertEq(list[0], publisher);
        assertEq(list[1], publisher2);

        address[] memory slice = registry.getPublisherList(1, 10);
        assertEq(slice.length, 1);
        assertEq(slice[0], publisher2);
    }

    function test_getSignalsByPool() public {
        bytes32 poolId2 = keccak256("another-pool");

        AurexSignal memory signal1 = AurexSignal({
            signalId: keccak256("batch-1"),
            poolId: poolId,
            riskScore: 30,
            alphaScore: 60,
            liquidityScore: 70,
            volatilityScore: 20,
            recommendedFee: 3000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        AurexSignal memory signal2 = AurexSignal({
            signalId: keccak256("batch-2"),
            poolId: poolId2,
            riskScore: 50,
            alphaScore: 40,
            liquidityScore: 60,
            volatilityScore: 30,
            recommendedFee: 5000,
            expiresAt: uint64(block.timestamp + 1 hours),
            signer: publisher
        });

        vm.startPrank(publisher);
        registry.publishSignal(signal1);
        registry.publishSignal(signal2);
        vm.stopPrank();

        bytes32[] memory ids = new bytes32[](2);
        ids[0] = poolId;
        ids[1] = poolId2;

        AurexSignal[] memory signals = registry.getSignalsByPool(ids);
        assertEq(signals.length, 2);
        assertEq(signals[0].riskScore, 30);
        assertEq(signals[1].riskScore, 50);
    }
}
