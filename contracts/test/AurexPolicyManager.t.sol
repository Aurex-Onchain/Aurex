// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {PoolPolicy} from "../src/libraries/AurexTypes.sol";

contract AurexPolicyManagerTest is Test {
    AurexPolicyManager policyManager;
    address admin = address(0x1);
    bytes32 poolId = keccak256("test-pool");

    function setUp() public {
        policyManager = new AurexPolicyManager();
    }

    function _defaultPolicy() internal view returns (PoolPolicy memory) {
        return PoolPolicy({
            maxRiskScore: 80,
            minLiquidityScore: 20,
            defaultFee: 3000,
            maxFee: 10000,
            publisherShareBps: 500,
            blockHighRiskTrades: true,
            allowSwapWhenSignalExpired: true,
            policyAdmin: admin
        });
    }

    function test_setPolicy() public {
        PoolPolicy memory policy = _defaultPolicy();
        policyManager.setPolicy(poolId, policy);

        assertTrue(policyManager.hasPolicy(poolId));
        assertEq(policyManager.getPolicyVersion(poolId), 1);

        PoolPolicy memory stored = policyManager.getPolicy(poolId);
        assertEq(stored.maxRiskScore, 80);
        assertEq(stored.defaultFee, 3000);
        assertEq(stored.policyAdmin, admin);
    }

    function test_policyVersionIncrementsOnUpdate() public {
        PoolPolicy memory policy = _defaultPolicy();
        policyManager.setPolicy(poolId, policy);
        assertEq(policyManager.getPolicyVersion(poolId), 1);

        vm.prank(admin);
        policy.defaultFee = 5000;
        policyManager.setPolicy(poolId, policy);
        assertEq(policyManager.getPolicyVersion(poolId), 2);

        PoolPolicy memory stored = policyManager.getPolicy(poolId);
        assertEq(stored.defaultFee, 5000);
    }

    function test_rejectUnauthorizedUpdate() public {
        PoolPolicy memory policy = _defaultPolicy();
        policyManager.setPolicy(poolId, policy);

        address unauthorized = address(0x99);
        vm.prank(unauthorized);
        vm.expectRevert("Not authorized");
        policyManager.setPolicy(poolId, policy);
    }

    function test_rejectInvalidFees() public {
        PoolPolicy memory policy = _defaultPolicy();
        policy.maxFee = 1_000_001;

        vm.expectRevert("Fee exceeds max");
        policyManager.setPolicy(poolId, policy);
    }

    function test_rejectDefaultFeeExceedsMax() public {
        PoolPolicy memory policy = _defaultPolicy();
        policy.defaultFee = 20000;
        policy.maxFee = 10000;

        vm.expectRevert("Default fee exceeds max");
        policyManager.setPolicy(poolId, policy);
    }

    function test_rejectInvalidAdmin() public {
        PoolPolicy memory policy = _defaultPolicy();
        policy.policyAdmin = address(0);

        vm.expectRevert("Invalid admin");
        policyManager.setPolicy(poolId, policy);
    }

    function test_anyoneCanCreateFirstPolicy() public {
        PoolPolicy memory policy = _defaultPolicy();

        vm.prank(admin);
        policyManager.setPolicy(poolId, policy);

        assertTrue(policyManager.hasPolicy(poolId));
        PoolPolicy memory stored = policyManager.getPolicy(poolId);
        assertEq(stored.policyAdmin, admin);
    }

    function test_adminCanTransfer() public {
        PoolPolicy memory policy = _defaultPolicy();
        policyManager.setPolicy(poolId, policy);

        address newAdmin = address(0x2);
        policy.policyAdmin = newAdmin;

        vm.prank(admin);
        policyManager.setPolicy(poolId, policy);

        PoolPolicy memory stored = policyManager.getPolicy(poolId);
        assertEq(stored.policyAdmin, newAdmin);
    }
}
