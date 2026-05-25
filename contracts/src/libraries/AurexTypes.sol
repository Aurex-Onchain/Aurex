// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

struct AurexSignal {
    bytes32 signalId;
    bytes32 poolId;
    uint256 riskScore;
    uint256 alphaScore;
    uint256 liquidityScore;
    uint256 volatilityScore;
    uint24 recommendedFee;
    uint64 expiresAt;
    address signer;
}

struct PoolPolicy {
    uint256 maxRiskScore;
    uint256 minLiquidityScore;
    uint24 defaultFee;
    uint24 maxFee;
    uint16 publisherShareBps;
    bool blockHighRiskTrades;
    bool allowSwapWhenSignalExpired;
    bool useWeightedSignal;
    address policyAdmin;
}

struct PublisherInfo {
    uint256 stakeAmount;
    uint256 signalCount;
    uint256 accuracyScore;
    uint256 slashCount;
    uint64 registeredAt;
    bool active;
}

struct SignalRecord {
    bytes32 signalId;
    bytes32 poolId;
    address publisher;
    uint256 alphaScore;
    uint160 priceAtPublish;
    uint64 expiresAt;
    bool verified;
    bool slashed;
}
