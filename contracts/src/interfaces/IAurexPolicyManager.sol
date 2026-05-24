// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolPolicy} from "../libraries/AurexTypes.sol";

interface IAurexPolicyManager {
    event PolicyUpdated(bytes32 indexed poolId, address indexed admin, uint256 version);
    event PolicyAdminTransferred(bytes32 indexed poolId, address indexed oldAdmin, address indexed newAdmin);

    function setPolicy(bytes32 poolId, PoolPolicy calldata policy) external;
    function getPolicy(bytes32 poolId) external view returns (PoolPolicy memory);
    function hasPolicy(bytes32 poolId) external view returns (bool);
    function getPolicyVersion(bytes32 poolId) external view returns (uint256);
}
