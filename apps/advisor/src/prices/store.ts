import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

export interface TokenPrice {
  token: string;
  priceUsd: number;
  timestamp: number;
}

export interface TokenPriceChange {
  token: string;
  currentPrice: number;
  price1hAgo: number | null;
  price24hAgo: number | null;
  change1hPct: number | null;
  change24hPct: number | null;
  volatility1h: number | null;
}

export interface TokenPriceStore {
  save(token: string, priceUsd: number): void;
  getLatest(token: string): TokenPrice | null;
  getHistory(token: string, since: number): TokenPrice[];
  getPriceChange(token: string): TokenPriceChange | null;
  getAllLatest(): TokenPrice[];
  close(): void;
}

export function createTokenPriceStore(dbPath: string): TokenPriceStore {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS token_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      price_usd REAL NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_token_prices_token_ts
    ON token_prices (token, timestamp DESC)
  `);

  const insertStmt = db.prepare(
    "INSERT INTO token_prices (token, price_usd, timestamp) VALUES (?, ?, ?)",
  );
  const latestStmt = db.prepare(
    "SELECT token, price_usd, timestamp FROM token_prices WHERE token = ? ORDER BY timestamp DESC LIMIT 1",
  );
  const historyStmt = db.prepare(
    "SELECT token, price_usd, timestamp FROM token_prices WHERE token = ? AND timestamp > ? ORDER BY timestamp ASC",
  );
  const allLatestStmt = db.prepare(`
    SELECT tp.token, tp.price_usd, tp.timestamp
    FROM token_prices tp
    INNER JOIN (SELECT token, MAX(timestamp) as max_ts FROM token_prices GROUP BY token) latest
    ON tp.token = latest.token AND tp.timestamp = latest.max_ts
  `);
  const priceAtStmt = db.prepare(
    "SELECT price_usd FROM token_prices WHERE token = ? AND timestamp <= ? ORDER BY timestamp DESC LIMIT 1",
  );

  return {
    save(token, priceUsd) {
      insertStmt.run(token.toLowerCase(), priceUsd, Date.now());
    },

    getLatest(token) {
      const row = latestStmt.get(token.toLowerCase()) as { token: string; price_usd: number; timestamp: number } | undefined;
      if (!row) return null;
      return { token: row.token, priceUsd: row.price_usd, timestamp: row.timestamp };
    },

    getHistory(token, since) {
      const rows = historyStmt.all(token.toLowerCase(), since) as { token: string; price_usd: number; timestamp: number }[];
      return rows.map((r) => ({ token: r.token, priceUsd: r.price_usd, timestamp: r.timestamp }));
    },

    getPriceChange(token) {
      const now = Date.now();
      const latest = latestStmt.get(token.toLowerCase()) as { token: string; price_usd: number; timestamp: number } | undefined;
      if (!latest) return null;

      const price1h = priceAtStmt.get(token.toLowerCase(), now - 3600000) as { price_usd: number } | undefined;
      const price24h = priceAtStmt.get(token.toLowerCase(), now - 86400000) as { price_usd: number } | undefined;

      const currentPrice = latest.price_usd;
      const change1hPct = price1h ? ((currentPrice - price1h.price_usd) / price1h.price_usd) * 100 : null;
      const change24hPct = price24h ? ((currentPrice - price24h.price_usd) / price24h.price_usd) * 100 : null;

      let volatility1h: number | null = null;
      const recentPrices = historyStmt.all(token.toLowerCase(), now - 3600000) as { price_usd: number }[];
      if (recentPrices.length >= 2) {
        const returns = [];
        for (let i = 1; i < recentPrices.length; i++) {
          const curr = recentPrices[i]!;
          const prev = recentPrices[i - 1]!;
          returns.push((curr.price_usd - prev.price_usd) / prev.price_usd);
        }
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
        volatility1h = Math.sqrt(variance) * 100;
      }

      return {
        token: token.toLowerCase(),
        currentPrice,
        price1hAgo: price1h?.price_usd ?? null,
        price24hAgo: price24h?.price_usd ?? null,
        change1hPct,
        change24hPct,
        volatility1h,
      };
    },

    getAllLatest() {
      const rows = allLatestStmt.all() as { token: string; price_usd: number; timestamp: number }[];
      return rows.map((r) => ({ token: r.token, priceUsd: r.price_usd, timestamp: r.timestamp }));
    },

    close() {
      db.close();
    },
  };
}
