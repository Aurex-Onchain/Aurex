import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { TradeRecord } from "./monitor.js";

export interface BehaviorStore {
  saveTrade(trade: TradeRecord): void;
  getTrades(windowMs: number): TradeRecord[];
  getAllTrades(): TradeRecord[];
  prune(olderThanMs: number): void;
  close(): void;
}

export function createBehaviorStore(dbPath: string): BehaviorStore {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS behavior_trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      direction TEXT NOT NULL,
      size_percent REAL NOT NULL,
      asset TEXT NOT NULL,
      pnl_percent REAL NOT NULL
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_behavior_timestamp
    ON behavior_trades (timestamp DESC)
  `);

  const insertStmt = db.prepare(
    "INSERT INTO behavior_trades (timestamp, direction, size_percent, asset, pnl_percent) VALUES (?, ?, ?, ?, ?)",
  );
  const windowStmt = db.prepare(
    "SELECT timestamp, direction, size_percent, asset, pnl_percent FROM behavior_trades WHERE timestamp > ? ORDER BY timestamp DESC",
  );
  const allStmt = db.prepare(
    "SELECT timestamp, direction, size_percent, asset, pnl_percent FROM behavior_trades ORDER BY timestamp DESC",
  );
  const pruneStmt = db.prepare(
    "DELETE FROM behavior_trades WHERE timestamp < ?",
  );

  function rowToTrade(row: { timestamp: number; direction: string; size_percent: number; asset: string; pnl_percent: number }): TradeRecord {
    return {
      timestamp: row.timestamp,
      direction: row.direction as "buy" | "sell",
      sizePercent: row.size_percent,
      asset: row.asset,
      pnlPercent: row.pnl_percent,
    };
  }

  return {
    saveTrade(trade) {
      insertStmt.run(trade.timestamp, trade.direction, trade.sizePercent, trade.asset, trade.pnlPercent);
    },

    getTrades(windowMs) {
      const cutoff = Date.now() - windowMs;
      const rows = windowStmt.all(cutoff) as { timestamp: number; direction: string; size_percent: number; asset: string; pnl_percent: number }[];
      return rows.map(rowToTrade);
    },

    getAllTrades() {
      const rows = allStmt.all() as { timestamp: number; direction: string; size_percent: number; asset: string; pnl_percent: number }[];
      return rows.map(rowToTrade);
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
