// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AurexSignal, PublisherInfo, SignalRecord} from "../libraries/AurexTypes.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

interface IAurexSignalRegistry {
    event SignalPublished(
        bytes32 indexed signalId,
        bytes32 indexed poolId,
        uint256 riskScore,
        uint256 alphaScore,
        uint24 recommendedFee,
        address signer
    );

    event PublisherAdded(address indexed publisher);
    event PublisherRemoved(address indexed publisher);
    event SignalVerified(bytes32 indexed signalId, bool accurate);
    event PublisherSlashed(address indexed publisher, bytes32 indexed signalId, uint256 amount);
    event PoolKeyRegistered(bytes32 indexed poolId);
    event AllowedPublishersUpdated(bytes32 indexed poolId, address[] publishers);

    function registerPublisher(uint256 amount) external;
    function increaseStake(uint256 amount) external;
    function unregisterPublisher() external;
    function publishSignal(AurexSignal calldata signal) external;
    function verifySignal(bytes32 signalId) external;
    function registerPoolKey(bytes32 poolId, PoolKey calldata key) external;
    function setAllowedPublishers(bytes32 poolId, address[] calldata publishers) external;
    function removeAllowedPublisher(bytes32 poolId, address publisher) external;

    function getLatestSignal(bytes32 poolId) external view returns (AurexSignal memory);
    function isSignalValid(bytes32 poolId) external view returns (bool);
    function getSignalCount(bytes32 poolId) external view returns (uint256);
    function getSignalsByPool(bytes32[] calldata poolIds) external view returns (AurexSignal[] memory);
    function getPublisherInfo(address publisher) external view returns (PublisherInfo memory);
    function getPublisherCount() external view returns (uint256);
    function getSignalRecord(bytes32 signalId) external view returns (SignalRecord memory);
    function getPublisherList(uint256 offset, uint256 limit) external view returns (address[] memory);
    function isPublisherAllowed(bytes32 poolId, address publisher) external view returns (bool);
}
