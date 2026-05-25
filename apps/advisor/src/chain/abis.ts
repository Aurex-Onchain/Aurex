export const signalRegistryAbi = [
  {
    type: "function",
    name: "getLatestSignal",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ name: "", type: "tuple", components: [
      { name: "signalId", type: "bytes32" },
      { name: "poolId", type: "bytes32" },
      { name: "riskScore", type: "uint256" },
      { name: "alphaScore", type: "uint256" },
      { name: "liquidityScore", type: "uint256" },
      { name: "volatilityScore", type: "uint256" },
      { name: "recommendedFee", type: "uint24" },
      { name: "expiresAt", type: "uint64" },
      { name: "signer", type: "address" },
    ]}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isSignalValid",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSignalCount",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSignalsByPool",
    inputs: [{ name: "poolIds", type: "bytes32[]" }],
    outputs: [{ name: "", type: "tuple[]", components: [
      { name: "signalId", type: "bytes32" },
      { name: "poolId", type: "bytes32" },
      { name: "riskScore", type: "uint256" },
      { name: "alphaScore", type: "uint256" },
      { name: "liquidityScore", type: "uint256" },
      { name: "volatilityScore", type: "uint256" },
      { name: "recommendedFee", type: "uint24" },
      { name: "expiresAt", type: "uint64" },
      { name: "signer", type: "address" },
    ]}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPublisherInfo",
    inputs: [{ name: "publisher", type: "address" }],
    outputs: [{ name: "", type: "tuple", components: [
      { name: "stakeAmount", type: "uint256" },
      { name: "signalCount", type: "uint256" },
      { name: "accuracyScore", type: "uint256" },
      { name: "slashCount", type: "uint256" },
      { name: "registeredAt", type: "uint64" },
      { name: "active", type: "bool" },
    ]}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPublisherCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPublisherList",
    inputs: [{ name: "offset", type: "uint256" }, { name: "limit", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSignalRecord",
    inputs: [{ name: "signalId", type: "bytes32" }],
    outputs: [{ name: "", type: "tuple", components: [
      { name: "signalId", type: "bytes32" },
      { name: "poolId", type: "bytes32" },
      { name: "publisher", type: "address" },
      { name: "alphaScore", type: "uint256" },
      { name: "priceAtPublish", type: "uint160" },
      { name: "expiresAt", type: "uint64" },
      { name: "verified", type: "bool" },
      { name: "slashed", type: "bool" },
    ]}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isPublisherAllowed",
    inputs: [{ name: "poolId", type: "bytes32" }, { name: "publisher", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "SignalPublished",
    inputs: [
      { name: "signalId", type: "bytes32", indexed: true },
      { name: "poolId", type: "bytes32", indexed: true },
      { name: "riskScore", type: "uint256", indexed: false },
      { name: "alphaScore", type: "uint256", indexed: false },
      { name: "recommendedFee", type: "uint24", indexed: false },
      { name: "signer", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PublisherSlashed",
    inputs: [
      { name: "publisher", type: "address", indexed: true },
      { name: "signalId", type: "bytes32", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SignalVerified",
    inputs: [
      { name: "signalId", type: "bytes32", indexed: true },
      { name: "accurate", type: "bool", indexed: false },
    ],
  },
] as const;

export const policyManagerAbi = [
  {
    type: "function",
    name: "getPolicy",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ name: "", type: "tuple", components: [
      { name: "maxRiskScore", type: "uint256" },
      { name: "minLiquidityScore", type: "uint256" },
      { name: "defaultFee", type: "uint24" },
      { name: "maxFee", type: "uint24" },
      { name: "publisherShareBps", type: "uint16" },
      { name: "blockHighRiskTrades", type: "bool" },
      { name: "allowSwapWhenSignalExpired", type: "bool" },
      { name: "policyAdmin", type: "address" },
    ]}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasPolicy",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPolicyVersion",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const alphaHookAbi = [
  {
    type: "function",
    name: "getClaimable",
    inputs: [{ name: "publisher", type: "address" }, { name: "token", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "RevenueShared",
    inputs: [
      { name: "poolId", type: "bytes32", indexed: true },
      { name: "publisher", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const poolManagerAbi = [
  {
    type: "function",
    name: "getSlot0",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "protocolFee", type: "uint24" },
      { name: "lpFee", type: "uint24" },
    ],
    stateMutability: "view",
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;
