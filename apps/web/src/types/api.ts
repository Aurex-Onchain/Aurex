export interface SerializedSignal {
  signalId: string;
  poolId: string;
  riskScore: string;
  alphaScore: string;
  liquidityScore: string;
  volatilityScore: string;
  recommendedFee: number;
  expiresAt: string;
  signer: string;
}

export interface SerializedPolicy {
  maxRiskScore: string;
  minLiquidityScore: string;
  defaultFee: number;
  maxFee: number;
  publisherShareBps: number;
  blockHighRiskTrades: boolean;
  allowSwapWhenSignalExpired: boolean;
  policyAdmin: string;
}

export interface SerializedPublisherInfo {
  stakeAmount: string;
  signalCount: string;
  accuracyScore: string;
  slashCount: string;
  registeredAt: string;
  active: boolean;
}

export interface PoolStatusResponse {
  poolId: string;
  policy: SerializedPolicy | null;
  latestSignal: SerializedSignal | null;
  signalValid: boolean;
  sqrtPriceX96: string;
  verified: boolean | null;
  slashed: boolean | null;
}

export interface MarketResponse {
  pools: PoolStatusResponse[];
  timestamp: number;
}

export interface PublisherSummaryResponse {
  address: string;
  info: SerializedPublisherInfo;
}

export interface StrategyResponse {
  market: {
    pools: PoolStatusResponse[];
    publishers: PublisherSummaryResponse[];
    timestamp: number;
  };
  userState: {
    address: string;
    balances: { token: string; symbol: string; balance: string }[];
    publisherInfo: SerializedPublisherInfo | null;
    claimable: { token: string; symbol: string; balance: string }[];
  } | null;
  behaviorStatus: BehaviorResponse;
  onchainData: OnchainDataResponse | null;
  timestamp: number;
}

export interface BehaviorResponse {
  level: "normal" | "info" | "warning" | "critical";
  alerts: BehaviorAlertResponse[];
}

export interface BehaviorAlertResponse {
  metric: string;
  current: number;
  threshold: number;
  level: "info" | "warning" | "critical";
  message: string;
}

export interface PublisherResponse {
  address: string | null;
  info: SerializedPublisherInfo | null;
  claimable: string | null;
}

export interface OnchainDataResponse {
  whaleMovementCount: number;
  liquidityChangeCount: number;
  volumeAnomalies: { poolId: string; ratio: number }[];
  priceDeviations: { token: string; maxDeviationBps: number }[];
}

export interface ConfigureRequest {
  watched_pools?: string[];
  score_threshold?: number;
  interval_ms?: number;
  private_key?: string;
  hot_tokens?: string[];
  signer_provider?: "private-key" | "onchainos";
  onchainos_address?: string;
  onchainos_auto_confirm?: boolean;
}

export interface ConfigureResponse {
  success: boolean;
  changes: string[];
}

export interface PublishResponse {
  poolId?: string;
  published?: boolean;
  txHash?: string | null;
  reason?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: number;
  version: string;
  loop: boolean;
  publisher: string | null;
}

export interface AdvisorConfigResponse {
  scoreChangeThreshold: number;
  intervalMs: number;
  poolIds: string[];
  hotTokens: string[];
  publisherAddress: string | null;
  hasPrivateKey: boolean;
  hasSigner: boolean;
  signer: { provider: "private-key" | "onchainos"; teeBacked: boolean } | null;
}
