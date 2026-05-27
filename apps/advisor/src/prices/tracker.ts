import type { ChainReader } from "../chain/index.js";
import type { TokenPriceStore } from "./store.js";
import type { MessageStore } from "../messages/store.js";
import type { AlertContext } from "../alerts/notifier.js";
import { createLogger } from "../logger.js";

const logger = createLogger();

export interface PriceTrackerConfig {
  hotTokens: `0x${string}`[];
  poolIds: `0x${string}`[];
  intervalMs: number;
  messageStore?: MessageStore;
  onAlert?: (alert: AlertContext) => void | Promise<void>;
}

export interface PriceTracker {
  start(): void;
  stop(): void;
  tick(): Promise<void>;
  isRunning(): boolean;
}

export function createPriceTracker(
  reader: ChainReader,
  store: TokenPriceStore,
  config: PriceTrackerConfig,
): PriceTracker {
  let timer: ReturnType<typeof setInterval> | null = null;

  function checkPriceAlert(token: string, currentPrice: number) {
    if (!config.messageStore) return;
    const change = store.getPriceChange(token);
    if (!change || change.change1hPct === null) return;
    const absPct = Math.abs(change.change1hPct);
    if (absPct >= 5) {
      const direction = change.change1hPct > 0 ? "+" : "";
      const symbol = tokenSymbol(token);
      const oldPrice = change.price1hAgo!;
      const content = `${symbol} moved ${direction}${change.change1hPct.toFixed(1)}% in the last hour ($${oldPrice.toFixed(2)} → $${currentPrice.toFixed(2)})`;
      config.messageStore.save({
        type: "price_alert",
        role: "assistant",
        content,
        metadata: { token, currentPrice, oldPrice, changePct: change.change1hPct },
      });
      logger.info({ token, changePct: change.change1hPct }, "Price alert emitted");

      if (config.onAlert) {
        config.onAlert({
          type: "whale_movement",
          summary: content,
          data: { token, currentPrice, oldPrice, changePct: change.change1hPct },
        });
      }
    }
  }

  async function tick() {
    for (const poolId of config.poolIds) {
      try {
        const sqrtPriceX96 = await reader.getSlot0Price(poolId);
        if (sqrtPriceX96 > 0n) {
          const price = sqrtPriceX96ToPrice(sqrtPriceX96);
          store.save(poolId, price);
          checkPriceAlert(poolId, price);
        }
      } catch {}
    }

    for (const token of config.hotTokens) {
      try {
        const price = await fetchTokenPrice(token);
        if (price !== null) {
          store.save(token, price);
          checkPriceAlert(token, price);
        }
      } catch {}
    }
  }

  return {
    start() {
      if (timer) return;
      tick();
      timer = setInterval(tick, config.intervalMs);
      logger.info(`Price tracker started (interval: ${config.intervalMs}ms, tokens: ${config.hotTokens.length}, pools: ${config.poolIds.length})`);
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    tick,
    isRunning() {
      return timer !== null;
    },
  };
}

function sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
  const Q96 = 2n ** 96n;
  const numerator = sqrtPriceX96 * sqrtPriceX96;
  const denominator = Q96 * Q96;
  const priceScaled = (numerator * 10n ** 18n) / denominator;
  return Number(priceScaled) / 1e18;
}

const COINGECKO_IDS: Record<string, string> = {
  "0x5a77f1443d16ee5761d310e38b62f77f726bc71c": "weth",
  "0x74b7f16337b8972027f6196a17a631ac6de26d22": "usd-coin",
  "0xea034fb02eb1808c2cc3adbc15f447b93cbe08e1": "wrapped-bitcoin",
  "0x1e4a5963abfd975d8c9021ce480b42188849d41d": "tether",
  "0x8819a7972e17c61a4eefe0f06e4bbef521228c82": "aurex",
  "0x0000000000000000000000000000000000000001": "pepe",
  "0x0000000000000000000000000000000000000002": "dogecoin",
  "0x0000000000000000000000000000000000000003": "solana",
  "0x0000000000000000000000000000000000000004": "bonk",
};

const TOKEN_SYMBOLS: Record<string, string> = {
  "0x5a77f1443d16ee5761d310e38b62f77f726bc71c": "WETH",
  "0x74b7f16337b8972027f6196a17a631ac6de26d22": "USDC",
  "0xea034fb02eb1808c2cc3adbc15f447b93cbe08e1": "WBTC",
  "0x1e4a5963abfd975d8c9021ce480b42188849d41d": "USDT",
  "0x8819a7972e17c61a4eefe0f06e4bbef521228c82": "AUREX",
  "0x0000000000000000000000000000000000000001": "PEPE",
  "0x0000000000000000000000000000000000000002": "DOGE",
  "0x0000000000000000000000000000000000000003": "SOL",
  "0x0000000000000000000000000000000000000004": "BONK",
};

function tokenSymbol(token: string): string {
  return TOKEN_SYMBOLS[token.toLowerCase()] || `${token.slice(0, 6)}...${token.slice(-4)}`;
}

async function fetchTokenPrice(token: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${token}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (res.ok) {
      const data = await res.json() as { pairs?: { priceUsd?: string }[] };
      const pair = data.pairs?.[0];
      if (pair?.priceUsd) return parseFloat(pair.priceUsd);
    }
  } catch {}

  const cgId = COINGECKO_IDS[token.toLowerCase()];
  if (!cgId || cgId === "aurex") return null;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json() as Record<string, { usd?: number }>;
    return data[cgId]?.usd ?? null;
  } catch {
    return null;
  }
}
