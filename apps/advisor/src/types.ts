export interface ChainConfig {
  rpcUrl: string;
  chainId: number;
}

export interface ContractAddresses {
  signalRegistry: `0x${string}`;
  policyManager: `0x${string}`;
  alphaHook: `0x${string}`;
  poolFactory: `0x${string}`;
  poolManager: `0x${string}`;
  aurexToken: `0x${string}`;
}

export interface ServerConfig {
  host: string;
  port: number;
}

export interface PublisherConfig {
  enabled: boolean;
  intervalMs: number;
  scoreChangeThreshold: number;
  signalDurationMs: number;
}

export interface BehaviorConfig {
  enabled: boolean;
  frequencyMultiplier: number;
  maxSingleTradePercent: number;
  maxConcentrationPercent: number;
  maxDailyLossPercent: number;
  lookbackDays: number;
}

export interface AdvisorConfig {
  chain: ChainConfig;
  contracts: ContractAddresses;
  server: ServerConfig;
  publisher: PublisherConfig;
  behavior: BehaviorConfig;
  hotTokens: `0x${string}`[];
}

export interface AurexSignal {
  signalId: `0x${string}`;
  poolId: `0x${string}`;
  riskScore: bigint;
  alphaScore: bigint;
  liquidityScore: bigint;
  volatilityScore: bigint;
  recommendedFee: number;
  expiresAt: bigint;
  signer: `0x${string}`;
}

export interface SignalRecord {
  signalId: `0x${string}`;
  poolId: `0x${string}`;
  publisher: `0x${string}`;
  alphaScore: bigint;
  priceAtPublish: bigint;
  expiresAt: bigint;
  verified: boolean;
  slashed: boolean;
}

export interface PublisherInfo {
  stakeAmount: bigint;
  signalCount: bigint;
  accuracyScore: bigint;
  slashCount: bigint;
  registeredAt: bigint;
  active: boolean;
}

export interface PoolPolicy {
  maxRiskScore: bigint;
  minLiquidityScore: bigint;
  defaultFee: number;
  maxFee: number;
  publisherShareBps: number;
  blockHighRiskTrades: boolean;
  allowSwapWhenSignalExpired: boolean;
  policyAdmin: `0x${string}`;
}

export interface MarketStatus {
  pools: PoolStatus[];
  publishers: PublisherSummary[];
  timestamp: number;
}

export interface PoolStatus {
  poolId: `0x${string}`;
  policy: PoolPolicy;
  latestSignal: AurexSignal | null;
  signalValid: boolean;
  sqrtPriceX96: bigint;
}

export interface PublisherSummary {
  address: `0x${string}`;
  info: PublisherInfo;
}

export interface StrategyContext {
  market: MarketStatus;
  userState: UserState | null;
  behaviorStatus: BehaviorStatus;
  onchainData: OnchainDataSummary | null;
  timestamp: number;
}

export interface OnchainDataSummary {
  whaleMovementCount: number;
  liquidityChangeCount: number;
  volumeAnomalies: { poolId: `0x${string}`; ratio: number }[];
  priceDeviations: { token: `0x${string}`; maxDeviationBps: number }[];
}

export interface UserState {
  address: `0x${string}`;
  balances: TokenBalance[];
  publisherInfo: PublisherInfo | null;
  claimable: TokenBalance[];
}

export interface TokenBalance {
  token: `0x${string}`;
  symbol: string;
  balance: bigint;
}

export interface BehaviorStatus {
  level: "normal" | "info" | "warning" | "critical";
  alerts: BehaviorAlert[];
}

export interface BehaviorAlert {
  metric: string;
  current: number;
  threshold: number;
  level: "info" | "warning" | "critical";
  message: string;
}
