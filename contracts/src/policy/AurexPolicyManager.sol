// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolPolicy} from "../libraries/AurexTypes.sol";
import {IAurexPolicyManager} from "../interfaces/IAurexPolicyManager.sol";

contract AurexPolicyManager is IAurexPolicyManager {
    mapping(bytes32 => PoolPolicy) public policies;
    mapping(bytes32 => bool) public policyExists;
    mapping(bytes32 => uint256) public policyVersions;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setPolicy(bytes32 poolId, PoolPolicy calldata policy) external {
        if (policyExists[poolId]) {
            address currentAdmin = policies[poolId].policyAdmin;
            require(
                msg.sender == owner || msg.sender == currentAdmin,
                "Not authorized"
            );
        }

        require(policy.maxFee <= 1_000_000, "Fee exceeds max");
        require(policy.defaultFee <= policy.maxFee, "Default fee exceeds max");
        require(policy.publisherShareBps <= 5000, "Publisher share exceeds 50%");
        require(policy.policyAdmin != address(0), "Invalid admin");

        address oldAdmin = policies[poolId].policyAdmin;
        policies[poolId] = policy;
        policyExists[poolId] = true;
        policyVersions[poolId]++;

        emit PolicyUpdated(poolId, msg.sender, policyVersions[poolId]);

        if (oldAdmin != address(0) && oldAdmin != policy.policyAdmin) {
            emit PolicyAdminTransferred(poolId, oldAdmin, policy.policyAdmin);
        }
    }

    function getPolicy(bytes32 poolId) external view returns (PoolPolicy memory) {
        return policies[poolId];
    }

    function hasPolicy(bytes32 poolId) external view returns (bool) {
        return policyExists[poolId];
    }

    function getPolicyVersion(bytes32 poolId) external view returns (uint256) {
        return policyVersions[poolId];
    }
}
