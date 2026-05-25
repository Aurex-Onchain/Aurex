export const CONTRACTS = {
  poolFactory: "0x6708213b47715771e290e41599de14e45E8C4358" as `0x${string}`,
  signalRegistry: "0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f" as `0x${string}`,
  policyManager: "0x025774B4e49b7Cb98D90111461B69Af98c301cD7" as `0x${string}`,
  alphaHook: "0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0" as `0x${string}`,
  poolManager: "0x360e68faccca8ca495c1b759fd9eee466db9fb32" as `0x${string}`,
  aurexToken: "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82" as `0x${string}`,
} as const;

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
}

export const TOKENS: TokenInfo[] = [
  { address: "0x5A77f1443D16ee5761d310e38b62f77f726bC71c", symbol: "WETH", decimals: 18 },
  { address: "0x74b7F16337b8972027F6196A17a631aC6dE26d22", symbol: "USDC", decimals: 6 },
  { address: "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1", symbol: "WBTC", decimals: 8 },
  { address: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d", symbol: "USDT", decimals: 6 },
  { address: "0xe538905cf8410324e03A5A23C1c177a474D59b2b", symbol: "WOKB", decimals: 18 },
  { address: "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82", symbol: "AUREX", decimals: 18 },
];

export const poolFactoryAbi = [
  {
    type: "function",
    name: "createPool",
    inputs: [
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "tickSpacing", type: "int24" },
      { name: "sqrtPriceX96", type: "uint160" },
      {
        name: "policy",
        type: "tuple",
        components: [
          { name: "maxRiskScore", type: "uint256" },
          { name: "minLiquidityScore", type: "uint256" },
          { name: "defaultFee", type: "uint24" },
          { name: "maxFee", type: "uint24" },
          { name: "publisherShareBps", type: "uint16" },
          { name: "blockHighRiskTrades", type: "bool" },
          { name: "allowSwapWhenSignalExpired", type: "bool" },
          { name: "policyAdmin", type: "address" },
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
] as const;

export const signalRegistryStakingAbi = [
  {
    type: "function",
    name: "registerPublisher",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "increaseStake",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unregisterPublisher",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
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
] as const;

export const signalRegistryVerifyAbi = [
  {
    type: "function",
    name: "verifySignal",
    inputs: [{ name: "signalId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isSignalValid",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
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
