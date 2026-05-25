import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export type MessageType = "recommendation" | "signal_alert" | "chat" | "strategy" | "price_alert" | "signal_expired" | "fee_change" | "system";
export type MessageRole = "assistant" | "user";

export interface Message {
  id: string;
  type: MessageType;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: number;
}

export interface MessageStore {
  save(msg: Omit<Message, "id" | "createdAt">): Message;
  list(opts: { since?: number; limit?: number }): Message[];
  get(id: string): Message | null;
  close(): void;
}

export function createMessageStore(dbPath: string): MessageStore {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_created
    ON messages (created_at DESC)
  `);

  const insertStmt = db.prepare(
    "INSERT INTO messages (id, type, role, content, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const listStmt = db.prepare(
    "SELECT id, type, role, content, metadata, created_at FROM messages WHERE created_at > ? ORDER BY created_at DESC LIMIT ?",
  );
  const getStmt = db.prepare(
    "SELECT id, type, role, content, metadata, created_at FROM messages WHERE id = ?",
  );

  function rowToMessage(row: { id: string; type: string; role: string; content: string; metadata: string | null; created_at: number }): Message {
    return {
      id: row.id,
      type: row.type as MessageType,
      role: row.role as MessageRole,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
    };
  }

  return {
    save(msg) {
      const id = randomUUID();
      const createdAt = Date.now();
      const metadataStr = msg.metadata ? JSON.stringify(msg.metadata) : null;
      insertStmt.run(id, msg.type, msg.role, msg.content, metadataStr, createdAt);
      return { id, ...msg, createdAt };
    },

    list({ since = 0, limit = 50 }) {
      const rows = listStmt.all(since, limit) as { id: string; type: string; role: string; content: string; metadata: string | null; created_at: number }[];
      return rows.map(rowToMessage);
    },

    get(id) {
      const row = getStmt.get(id) as { id: string; type: string; role: string; content: string; metadata: string | null; created_at: number } | undefined;
      return row ? rowToMessage(row) : null;
    },

    close() {
      db.close();
    },
  };
}
