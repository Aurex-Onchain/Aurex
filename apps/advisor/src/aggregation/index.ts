import type { PublicClient, Address } from "viem";
import { parseAbiItem } from "viem";

export interface WhaleMovement {
  from: Address;
  to: Address;
  value: bigint;
  token: Address;
  blockNumber: bigint;
  txHash: `0x${string}`;
  timestamp: number;
}

export interface LiquidityChange {
  poolId: `0x${string}`;
  type: "add" | "remove";
  amount0: bigint;
  amount1: bigint;
  blockNumber: bigint;
  txHash: `0x${string}`;
  timestamp: number;
}

export interface VolumeAnomaly {
  poolId: `0x${string}`;
  currentVolume: bigint;
  averageVolume: bigint;
  ratio: number;
  blockNumber: bigint;
}

export interface PriceDeviation {
  token: Address;
  pools: { poolId: `0x${string}`; price: bigint }[];
  maxDeviationBps: number;
}

export interface AggregationResult {
  whaleMovements: WhaleMovement[];
  liquidityChanges: LiquidityChange[];
  volumeAnomalies: VolumeAnomaly[];
  priceDeviations: PriceDeviation[];
  timestamp: number;
}

export interface AggregatorConfig {
  whaleThresholdWei: bigint;
  volumeAnomalyMultiplier: number;
  priceDeviationThresholdBps: number;
  lookbackBlocks: number;
}

export const defaultAggregatorConfig: AggregatorConfig = {
  whaleThresholdWei: 100000000000000000000n, // 100 ETH
  volumeAnomalyMultiplier: 3.0,
  priceDeviationThresholdBps: 50,
  lookbackBlocks: 1000,
};

const TRANSFER_EVENT = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
const SWAP_EVENT = parseAbiItem("event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)");
const MODIFY_LIQUIDITY_EVENT = parseAbiItem("event ModifyLiquidity(bytes32 indexed id, address indexed sender, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes32 salt)");

export interface OnchainAggregator {
  fetchWhaleMovements(tokens: Address[]): Promise<WhaleMovement[]>;
  fetchLiquidityChanges(poolManagerAddress: Address): Promise<LiquidityChange[]>;
  detectVolumeAnomalies(poolManagerAddress: Address, poolIds: `0x${string}`[], historicalVolumes: Map<string, bigint>): Promise<VolumeAnomaly[]>;
  detectPriceDeviations(poolIds: `0x${string}`[], getPrices: (poolId: `0x${string}`) => Promise<bigint>): Promise<PriceDeviation[]>;
  aggregate(params: AggregateParams): Promise<AggregationResult>;
}

export interface AggregateParams {
  tokens: Address[];
  poolManagerAddress: Address;
  poolIds: `0x${string}`[];
  historicalVolumes: Map<string, bigint>;
  getPrices: (poolId: `0x${string}`) => Promise<bigint>;
}

export function createOnchainAggregator(
  client: PublicClient,
  config: AggregatorConfig = defaultAggregatorConfig,
): OnchainAggregator {
  async function getBlockRange(): Promise<{ fromBlock: bigint; toBlock: bigint }> {
    const latest = await client.getBlockNumber();
    return { fromBlock: latest - BigInt(config.lookbackBlocks), toBlock: latest };
  }

  return {
    async fetchWhaleMovements(tokens) {
      const { fromBlock, toBlock } = await getBlockRange();
      const movements: WhaleMovement[] = [];

      for (const token of tokens) {
        const logs = await client.getLogs({
          address: token,
          event: TRANSFER_EVENT,
          fromBlock,
          toBlock,
        });

        for (const log of logs) {
          const value = log.args.value ?? 0n;
          if (value >= config.whaleThresholdWei) {
            movements.push({
              from: log.args.from!,
              to: log.args.to!,
              value,
              token,
              blockNumber: log.blockNumber,
              txHash: log.transactionHash!,
              timestamp: Date.now(),
            });
          }
        }
      }

      return movements.sort((a, b) => Number(b.blockNumber - a.blockNumber));
    },

    async fetchLiquidityChanges(poolManagerAddress) {
      const { fromBlock, toBlock } = await getBlockRange();
      const changes: LiquidityChange[] = [];

      const logs = await client.getLogs({
        address: poolManagerAddress,
        event: MODIFY_LIQUIDITY_EVENT,
        fromBlock,
        toBlock,
      });

      for (const log of logs) {
        const delta = log.args.liquidityDelta ?? 0n;
        changes.push({
          poolId: (log.args.id ?? ("0x" + "0".repeat(64))) as `0x${string}`,
          type: delta > 0n ? "add" : "remove",
          amount0: delta > 0n ? delta : -delta,
          amount1: 0n,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash!,
          timestamp: Date.now(),
        });
      }

      return changes;
    },

    async detectVolumeAnomalies(poolManagerAddress, poolIds, historicalVolumes) {
      const { fromBlock, toBlock } = await getBlockRange();
      const anomalies: VolumeAnomaly[] = [];

      const logs = await client.getLogs({
        address: poolManagerAddress,
        event: SWAP_EVENT,
        fromBlock,
        toBlock,
      });

      const volumeByPool = new Map<string, bigint>();
      for (const log of logs) {
        const id = log.args.id;
        if (!id || !poolIds.includes(id as `0x${string}`)) continue;
        const amount = log.args.amount0 ?? 0n;
        const abs = amount < 0n ? -amount : amount;
        volumeByPool.set(id, (volumeByPool.get(id) ?? 0n) + abs);
      }

      for (const [poolId, currentVolume] of volumeByPool) {
        const avgVolume = historicalVolumes.get(poolId) ?? 0n;
        if (avgVolume === 0n) continue;
        const ratio = Number(currentVolume * 100n / avgVolume) / 100;
        if (ratio >= config.volumeAnomalyMultiplier) {
          anomalies.push({
            poolId: poolId as `0x${string}`,
            currentVolume,
            averageVolume: avgVolume,
            ratio,
            blockNumber: toBlock,
          });
        }
      }

      return anomalies;
    },

    async detectPriceDeviations(poolIds, getPrices) {
      const deviations: PriceDeviation[] = [];
      const pricesByToken = new Map<string, { poolId: `0x${string}`; price: bigint }[]>();

      for (const poolId of poolIds) {
        try {
          const price = await getPrices(poolId);
          const tokenKey = poolId.slice(0, 10);
          const existing = pricesByToken.get(tokenKey) ?? [];
          existing.push({ poolId, price });
          pricesByToken.set(tokenKey, existing);
        } catch {
          continue;
        }
      }

      for (const [token, pools] of pricesByToken) {
        if (pools.length < 2) continue;
        const prices = pools.map((p) => p.price);
        const max = prices.reduce((a, b) => (a > b ? a : b));
        const min = prices.reduce((a, b) => (a < b ? a : b));
        if (min === 0n) continue;
        const deviationBps = Number((max - min) * 10000n / min);
        if (deviationBps >= config.priceDeviationThresholdBps) {
          deviations.push({
            token: token as Address,
            pools,
            maxDeviationBps: deviationBps,
          });
        }
      }

      return deviations;
    },

    async aggregate(params) {
      const [whaleMovements, liquidityChanges, volumeAnomalies, priceDeviations] = await Promise.all([
        this.fetchWhaleMovements(params.tokens),
        this.fetchLiquidityChanges(params.poolManagerAddress),
        this.detectVolumeAnomalies(params.poolManagerAddress, params.poolIds, params.historicalVolumes),
        this.detectPriceDeviations(params.poolIds, params.getPrices),
      ]);

      return { whaleMovements, liquidityChanges, volumeAnomalies, priceDeviations, timestamp: Date.now() };
    },
  };
}
