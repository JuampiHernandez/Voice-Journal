/**
 * One-time migration: local SQLite (data/voice-journal.db) → Supabase Postgres.
 *
 * Usage: node scripts/migrate-sqlite-to-supabase.mjs [userId]
 *   Omit userId to migrate all users.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const DB = path.join(process.cwd(), "data/voice-journal.db");
const filterUserId = process.argv[2]?.trim();

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase env vars required in .env.local");
  process.exit(1);
}

function queryJson(sql) {
  const out = execSync(`sqlite3 -json "${DB}" ${JSON.stringify(sql)}`, { encoding: "utf8" });
  return out.trim() ? JSON.parse(out) : [];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upsert(table, rows) {
  if (!rows.length) return 0;
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  return rows.length;
}

function userFilter(column = "user_id") {
  return filterUserId ? ` WHERE ${column} = '${filterUserId.replace(/'/g, "''")}'` : "";
}

async function main() {
  console.log(`Migrating from ${DB}${filterUserId ? ` (user: ${filterUserId})` : " (all users)"}\n`);

  const users = queryJson(`SELECT * FROM users${userFilter("id")}`);
  const userRows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email ?? null,
    check_in_time: u.check_in_time ?? "21:00",
    email_reminders_enabled: Boolean(u.email_reminders_enabled),
    timezone: u.timezone ?? "UTC",
    last_reminder_sent_date: u.last_reminder_sent_date ?? null,
    created_at: u.created_at,
  }));
  console.log(`users: ${await upsert("users", userRows)}`);

  const entries = queryJson(`SELECT * FROM journal_entries${userFilter()}`);
  console.log(`journal_entries: ${await upsert("journal_entries", entries)}`);

  const moments = queryJson(`SELECT * FROM emotional_moments${userFilter()}`);
  console.log(`emotional_moments: ${await upsert("emotional_moments", moments)}`);

  const weekly = queryJson(`SELECT * FROM weekly_summaries${userFilter()}`);
  console.log(`weekly_summaries: ${await upsert("weekly_summaries", weekly)}`);

  const threads = queryJson(`SELECT * FROM worry_thread_snapshots${userFilter()}`);
  console.log(`worry_thread_snapshots: ${await upsert("worry_thread_snapshots", threads)}`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
