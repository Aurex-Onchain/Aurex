import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { PriceSnapshot } from "./types.js";

export interface PriceStore {
  save(poolId: string, snapshot: PriceSnapshot): void;
  getHistory(poolId: string, limit: number): PriceSnapshot[];
  getLatest(poolId: string): PriceSnapshot | null;
  prune(olderThanMs: number): void;
  close(): void;
}

export function createPriceStore(dbPath: string): PriceStore {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS price_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id TEXT NOT NULL,
      sqrt_price_x96 TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pool_timestamp
    ON price_snapshots (pool_id, timestamp DESC)
  `);

  const insertStmt = db.prepare(
    "INSERT INTO price_snapshots (pool_id, sqrt_price_x96, timestamp) VALUES (?, ?, ?)",
  );
  const historyStmt = db.prepare(
    "SELECT sqrt_price_x96, timestamp FROM price_snapshots WHERE pool_id = ? ORDER BY timestamp DESC LIMIT ?",
  );
  const latestStmt = db.prepare(
    "SELECT sqrt_price_x96, timestamp FROM price_snapshots WHERE pool_id = ? ORDER BY timestamp DESC LIMIT 1",
  );
  const pruneStmt = db.prepare(
    "DELETE FROM price_snapshots WHERE timestamp < ?",
  );

  return {
    save(poolId, snapshot) {
      insertStmt.run(poolId, snapshot.sqrtPriceX96.toString(), snapshot.timestamp);
    },

    getHistory(poolId, limit) {
      const rows = historyStmt.all(poolId, limit) as { sqrt_price_x96: string; timestamp: number }[];
      return rows.reverse().map((r) => ({
        sqrtPriceX96: BigInt(r.sqrt_price_x96),
        timestamp: r.timestamp,
      }));
    },

    getLatest(poolId) {
      const row = latestStmt.get(poolId) as { sqrt_price_x96: string; timestamp: number } | undefined;
      if (!row) return null;
      return { sqrtPriceX96: BigInt(row.sqrt_price_x96), timestamp: row.timestamp };
    },

    prune(olderThanMs) {
      const cutoff = Date.now() - olderThanMs;
      pruneStmt.run(cutoff);
    },

    close() {
      db.close();
    },
  };
}
