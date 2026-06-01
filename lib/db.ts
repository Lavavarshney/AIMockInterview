import { Pool } from "pg";

type GlobalWithPool = typeof globalThis & {
  __hireflowPool?: Pool;
  __hireflowInit?: Promise<void>;
};

const globalWithPool = globalThis as GlobalWithPool;

const connectionString = process.env.DATABASE_URL;

export const pool =
  globalWithPool.__hireflowPool ||
  new Pool({
    connectionString,
    max: 10
  });

if (process.env.NODE_ENV !== "production") {
  globalWithPool.__hireflowPool = pool;
}

export async function ensureHistoryTable() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (!globalWithPool.__hireflowInit) {
    globalWithPool.__hireflowInit = (async () => {
      try {
        console.log("[DB] Creating interview_sessions table...");
        await pool.query(
          `CREATE TABLE IF NOT EXISTS interview_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            session_type TEXT NOT NULL,
            score INTEGER NOT NULL,
            feedback TEXT NOT NULL,
            answers JSONB NOT NULL,
            expert_answer_rewrites JSONB NOT NULL,
            date_label TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`
        );
        console.log("[DB] Table created");
        
        console.log("[DB] Creating index...");
        await pool.query(
          `CREATE INDEX IF NOT EXISTS interview_sessions_user_id_created_at_idx
            ON interview_sessions (user_id, created_at DESC)`
        );
        console.log("[DB] Index created");
      } catch (err) {
        console.error("[DB] Failed to initialize:", err);
        throw err;
      }
    })();
  }

  await globalWithPool.__hireflowInit;
}
