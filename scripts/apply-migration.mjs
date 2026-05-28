import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL_NON_POOLING in .env.local");
  process.exit(1);
}

const sqlPath = path.join(
  process.cwd(),
  "supabase/migrations/20260527000000_voice_journal.sql"
);
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  connectionString,
  ssl: process.env.POSTGRES_URL_NON_POOLING?.includes("pooler")
    ? { rejectUnauthorized: false }
    : undefined,
});
await client.connect();
try {
  await client.query(sql);
  console.log("Migration applied successfully");
} finally {
  await client.end();
}
