/**
 * One-time migration: copy Supabase Postgres + Storage into local SQLite + data/audio/.
 *
 * Requires in .env (your existing Supabase project — not committed):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx scripts/migrate-supabase-to-sqlite.ts
 *   npx tsx scripts/migrate-supabase-to-sqlite.ts --force   # overwrite existing SQLite rows
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "../src/lib/db";
import { uploadAudio } from "../src/lib/storage";

const BUCKET = "journal-audio";
const force = process.argv.includes("--force");

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function boolInt(value: boolean | null | undefined): number {
  return value ? 1 : 0;
}

async function downloadAudio(
  supabase: { storage: { from: (b: string) => { download: (p: string) => Promise<{ data: Blob | null; error: { message: string } | null }> } } },
  storagePath: string
): Promise<boolean> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) {
    console.warn(`  ⚠ audio missing: ${storagePath} — ${error?.message ?? "not found"}`);
    return false;
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  uploadAudio(storagePath, buffer);
  return true;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const db = getDb();
  console.log(`Target: ${process.cwd()}/data/voice-journal.db`);
  if (force) console.log("Mode: --force (replace rows)\n");
  else console.log("Mode: skip existing primary keys\n");

  const tables = [
    {
      name: "users",
      sql: `INSERT OR ${force ? "REPLACE" : "IGNORE"} INTO users
        (id, name, email, check_in_time, email_reminders_enabled, timezone, last_reminder_sent_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      map: (r: Record<string, unknown>) => [
        r.id,
        r.name ?? "Journaler",
        r.email ?? null,
        r.check_in_time ?? "21:00",
        boolInt(r.email_reminders_enabled as boolean),
        r.timezone ?? "UTC",
        dateOnly(r.last_reminder_sent_date as string),
        r.created_at,
      ],
    },
    {
      name: "journal_entries",
      sql: `INSERT OR ${force ? "REPLACE" : "IGNORE"} INTO journal_entries
        (id, user_id, entry_date, transcript, summary, mood, themes, open_thread, duration_seconds, conversation_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      map: (r: Record<string, unknown>) => [
        r.id,
        r.user_id,
        dateOnly(r.entry_date as string),
        r.transcript,
        r.summary ?? null,
        r.mood ?? null,
        r.themes ?? null,
        r.open_thread ?? null,
        r.duration_seconds ?? 0,
        r.conversation_id ?? null,
        r.created_at,
      ],
    },
    {
      name: "emotional_moments",
      sql: `INSERT OR ${force ? "REPLACE" : "IGNORE"} INTO emotional_moments
        (id, user_id, entry_id, moment_date, description, emotion, intensity, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      map: (r: Record<string, unknown>) => [
        r.id,
        r.user_id,
        r.entry_id ?? null,
        dateOnly(r.moment_date as string),
        r.description,
        r.emotion,
        r.intensity ?? 0.5,
        r.created_at,
      ],
    },
    {
      name: "weekly_summaries",
      sql: `INSERT OR ${force ? "REPLACE" : "IGNORE"} INTO weekly_summaries
        (id, user_id, week_start, week_end, summary, insights, support_note, voice_script, audio_path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      map: (r: Record<string, unknown>) => [
        r.id,
        r.user_id,
        dateOnly(r.week_start as string),
        dateOnly(r.week_end as string),
        r.summary,
        r.insights ?? null,
        r.support_note ?? null,
        r.voice_script ?? null,
        r.audio_path ?? null,
        r.created_at,
      ],
    },
    {
      name: "worry_thread_snapshots",
      sql: `INSERT OR ${force ? "REPLACE" : "IGNORE"} INTO worry_thread_snapshots
        (id, user_id, threads_json, focus_recommendation, bright_threads_json, celebrate_recommendation, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      map: (r: Record<string, unknown>) => [
        r.id,
        r.user_id,
        r.threads_json,
        r.focus_recommendation ?? null,
        r.bright_threads_json ?? "[]",
        r.celebrate_recommendation ?? null,
        r.generated_at,
      ],
    },
    {
      name: "memoirs",
      sql: `INSERT OR ${force ? "REPLACE" : "IGNORE"} INTO memoirs
        (id, user_id, year, script, narration_path, music_path, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      map: (r: Record<string, unknown>) => [
        r.id,
        r.user_id,
        r.year,
        r.script,
        r.narration_path ?? null,
        r.music_path ?? null,
        r.status ?? "pending",
        r.created_at,
      ],
    },
  ] as const;

  for (const table of tables) {
    const { data, error } = await supabase.from(table.name).select("*");
    if (error) {
      console.error(`Failed to read ${table.name}:`, error.message);
      process.exit(1);
    }
    const rows = data ?? [];
    const stmt = db.prepare(table.sql);
    let inserted = 0;
    for (const row of rows) {
      const result = stmt.run(...table.map(row as Record<string, unknown>));
      if (result.changes > 0) inserted++;
    }
    console.log(`${table.name}: ${rows.length} remote → ${inserted} written`);
  }

  const audioPaths = new Set<string>();
  const weekly = await supabase.from("weekly_summaries").select("audio_path");
  for (const r of weekly.data ?? []) {
    if (r.audio_path) audioPaths.add(r.audio_path);
  }
  const memoirs = await supabase.from("memoirs").select("narration_path, music_path");
  for (const r of memoirs.data ?? []) {
    if (r.narration_path) audioPaths.add(r.narration_path);
    if (r.music_path) audioPaths.add(r.music_path);
  }

  console.log(`\nDownloading ${audioPaths.size} audio file(s) from bucket "${BUCKET}"…`);
  let ok = 0;
  for (const path of audioPaths) {
    if (await downloadAudio(supabase, path)) ok++;
  }
  console.log(`Audio: ${ok}/${audioPaths.size} saved under data/audio/`);

  console.log("\nDone. Supabase project is unchanged — remove Supabase vars from .env when finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
