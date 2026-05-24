// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {AurexSignal, PublisherInfo, SignalRecord, PoolPolicy} from "../libraries/AurexTypes.sol";
import {IAurexSignalRegistry} from "../interfaces/IAurexSignalRegistry.sol";
import {IAurexPolicyManager} from "../interfaces/IAurexPolicyManager.sol";

contract AurexSignalRegistry is IAurexSignalRegistry {
    using StateLibrary for IPoolManager;
    using PoolIdLibrary for PoolKey;

    IERC20 public immutable stakeToken;
    IPoolManager public immutable poolManager;
    address public policyManagerAddress;

    uint256 public minStake;
    uint256 public slashPercent = 10;
    uint64 public cooldownPeriod = 1 days;

    mapping(address => PublisherInfo) public publishers;
    mapping(bytes32 => AurexSignal) public latestSignals;
    mapping(bytes32 => uint256) public signalCounts;
    mapping(bytes32 => SignalRecord) public signalRecords;
    mapping(bytes32 => PoolKey) public poolKeys;
    mapping(bytes32 => bool) public poolKeyRegistered;
    mapping(bytes32 => mapping(address => bool)) public allowedPublishers;
    mapping(bytes32 => bool) public hasPublisherWhitelist;

    address public owner;
    address[] public publisherList;

    modifier onlyActivePublisher() {
        require(publishers[msg.sender].active, "Not active publisher");
        require(publishers[msg.sender].stakeAmount >= minStake, "Insufficient stake");
        _;
    }

    constructor(address _stakeToken, address _poolManager, uint256 _minStake) {
        stakeToken = IERC20(_stakeToken);
        poolManager = IPoolManager(_poolManager);
        minStake = _minStake;
        owner = msg.sender;
    }

    function setPolicyManager(address _policyManager) external {
        require(msg.sender == owner, "Not owner");
        policyManagerAddress = _policyManager;
    }

    // --- Pool Key Registration ---

    function registerPoolKey(bytes32 poolId, PoolKey calldata key) external {
        require(!poolKeyRegistered[poolId], "Pool key already registered");
        bytes32 computedId = keccak256(abi.encode(key));
        require(computedId == poolId, "Pool key does not match poolId");
        poolKeys[poolId] = key;
        poolKeyRegistered[poolId] = true;
        emit PoolKeyRegistered(poolId);
    }

    // --- Publisher Whitelist ---

    function setAllowedPublishers(bytes32 poolId, address[] calldata _publishers) external {
        require(poolKeyRegistered[poolId], "Pool not registered");
        IAurexPolicyManager policyMgr = IAurexPolicyManager(policyManagerAddress);
        PoolPolicy memory policy = policyMgr.getPolicy(poolId);
        require(msg.sender == policy.policyAdmin || msg.sender == owner, "Not pool admin");

        hasPublisherWhitelist[poolId] = _publishers.length > 0;
        for (uint256 i = 0; i < _publishers.length; i++) {
            allowedPublishers[poolId][_publishers[i]] = true;
        }
        emit AllowedPublishersUpdated(poolId, _publishers);
    }

    function removeAllowedPublisher(bytes32 poolId, address publisher) external {
        require(poolKeyRegistered[poolId], "Pool not registered");
        IAurexPolicyManager policyMgr = IAurexPolicyManager(policyManagerAddress);
        PoolPolicy memory policy = policyMgr.getPolicy(poolId);
        require(msg.sender == policy.policyAdmin || msg.sender == owner, "Not pool admin");
        allowedPublishers[poolId][publisher] = false;
    }

    // --- Publisher Registration ---

    function registerPublisher(uint256 amount) external {
        require(!publishers[msg.sender].active, "Already registered");
        require(amount >= minStake, "Below minimum stake");

        stakeToken.transferFrom(msg.sender, address(this), amount);

        publishers[msg.sender] = PublisherInfo({
            stakeAmount: amount,
            signalCount: 0,
            accuracyScore: 50,
            slashCount: 0,
            registeredAt: uint64(block.timestamp),
            active: true
        });
        publisherList.push(msg.sender);

        emit PublisherAdded(msg.sender);
    }

    function increaseStake(uint256 amount) external {
        require(publishers[msg.sender].active, "Not registered");
        stakeToken.transferFrom(msg.sender, address(this), amount);
        publishers[msg.sender].stakeAmount += amount;
    }

    function unregisterPublisher() external {
        PublisherInfo storage pub = publishers[msg.sender];
        require(pub.active, "Not registered");
        require(block.timestamp >= pub.registeredAt + cooldownPeriod, "Cooldown not met");

        pub.active = false;
        uint256 refund = pub.stakeAmount;
        pub.stakeAmount = 0;

        stakeToken.transfer(msg.sender, refund);
        emit PublisherRemoved(msg.sender);
    }

    // --- Signal Publishing ---

    function publishSignal(AurexSignal calldata signal) external onlyActivePublisher {
        require(signal.expiresAt > block.timestamp, "Signal already expired");
        require(signal.riskScore <= 100, "Risk score out of range");
        require(signal.alphaScore <= 100, "Alpha score out of range");

        if (hasPublisherWhitelist[signal.poolId]) {
            require(allowedPublishers[signal.poolId][msg.sender], "Not allowed for this pool");
        }

        latestSignals[signal.poolId] = signal;
        signalCounts[signal.poolId]++;
        publishers[msg.sender].signalCount++;

        uint160 currentPrice = 0;
        if (poolKeyRegistered[signal.poolId]) {
            PoolId pid = poolKeys[signal.poolId].toId();
            (currentPrice,,,) = poolManager.getSlot0(pid);
        }

        signalRecords[signal.signalId] = SignalRecord({
            signalId: signal.signalId,
            poolId: signal.poolId,
            publisher: msg.sender,
            alphaScore: signal.alphaScore,
            priceAtPublish: currentPrice,
            expiresAt: signal.expiresAt,
            verified: false,
            slashed: false
        });

        emit SignalPublished(
            signal.signalId,
            signal.poolId,
            signal.riskScore,
            signal.alphaScore,
            signal.recommendedFee,
            signal.signer
        );
    }

    // --- Signal Verification ---

    function verifySignal(bytes32 signalId) external {
        SignalRecord storage record = signalRecords[signalId];
        require(record.publisher != address(0), "Signal not found");
        require(!record.verified, "Already verified");
        require(block.timestamp >= record.expiresAt, "Signal not expired yet");
        require(record.priceAtPublish > 0, "No price recorded at publish");
        require(poolKeyRegistered[record.poolId], "Pool key not registered");

        record.verified = true;

        PoolId pid = poolKeys[record.poolId].toId();
        (uint160 currentPrice,,,) = poolManager.getSlot0(pid);

        bool predictedUp = record.alphaScore > 50;
        bool actuallyUp = currentPrice > record.priceAtPublish;

        if (predictedUp == actuallyUp) {
            PublisherInfo storage pub = publishers[record.publisher];
            if (pub.accuracyScore < 95) {
                pub.accuracyScore += 2;
            }
            emit SignalVerified(signalId, true);
        } else {
            _slash(record.publisher, signalId);
            emit SignalVerified(signalId, false);
        }
    }

    function _slash(address publisher, bytes32 signalId) internal {
        PublisherInfo storage pub = publishers[publisher];
        uint256 slashAmount = (pub.stakeAmount * slashPercent) / 100;

        if (slashAmount > pub.stakeAmount) {
            slashAmount = pub.stakeAmount;
        }

        pub.stakeAmount -= slashAmount;
        pub.slashCount++;
        if (pub.accuracyScore > 5) {
            pub.accuracyScore -= 5;
        }

        signalRecords[signalId].slashed = true;

        stakeToken.transfer(owner, slashAmount);
        emit PublisherSlashed(publisher, signalId, slashAmount);
    }

    // --- View Functions ---

    function getLatestSignal(bytes32 poolId) external view returns (AurexSignal memory) {
        return latestSignals[poolId];
    }

    function isSignalValid(bytes32 poolId) external view returns (bool) {
        AurexSignal memory signal = latestSignals[poolId];
        return signal.expiresAt > block.timestamp && signal.signer != address(0);
    }

    function getSignalCount(bytes32 poolId) external view returns (uint256) {
        return signalCounts[poolId];
    }

    function getSignalsByPool(bytes32[] calldata poolIds) external view returns (AurexSignal[] memory) {
        AurexSignal[] memory signals = new AurexSignal[](poolIds.length);
        for (uint256 i = 0; i < poolIds.length; i++) {
            signals[i] = latestSignals[poolIds[i]];
        }
        return signals;
    }

    function getPublisherInfo(address publisher) external view returns (PublisherInfo memory) {
        return publishers[publisher];
    }

    function getPublisherCount() external view returns (uint256) {
        return publisherList.length;
    }

    function getSignalRecord(bytes32 signalId) external view returns (SignalRecord memory) {
        return signalRecords[signalId];
    }

    function getPublisherList(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 total = publisherList.length;
        if (offset >= total) {
            return new address[](0);
        }
        uint256 end = offset + limit;
        if (end > total) end = total;
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = publisherList[i];
        }
        return result;
    }

    function isPublisherAllowed(bytes32 poolId, address publisher) external view returns (bool) {
        if (!hasPublisherWhitelist[poolId]) return true;
        return allowedPublishers[poolId][publisher];
    }

    // --- Admin ---

    function setMinStake(uint256 _minStake) external {
        require(msg.sender == owner, "Not owner");
        minStake = _minStake;
    }

    function setSlashPercent(uint256 _slashPercent) external {
        require(msg.sender == owner, "Not owner");
        require(_slashPercent <= 100, "Invalid percent");
        slashPercent = _slashPercent;
    }
}
