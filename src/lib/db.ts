import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { addDays, format, parseISO } from "date-fns";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "voice-journal.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Journaler',
      check_in_time TEXT NOT NULL DEFAULT '21:00',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      transcript TEXT NOT NULL,
      summary TEXT,
      mood REAL,
      themes TEXT,
      duration_seconds INTEGER DEFAULT 0,
      conversation_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, entry_date)
    );

    CREATE TABLE IF NOT EXISTS emotional_moments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entry_id TEXT,
      moment_date TEXT NOT NULL,
      description TEXT NOT NULL,
      emotion TEXT NOT NULL,
      intensity REAL NOT NULL DEFAULT 0.5,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (entry_id) REFERENCES journal_entries(id)
    );

    CREATE TABLE IF NOT EXISTS weekly_summaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      summary TEXT NOT NULL,
      insights TEXT,
      support_note TEXT,
      voice_script TEXT,
      audio_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, week_start)
    );

    CREATE TABLE IF NOT EXISTS worry_thread_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      threads_json TEXT NOT NULL,
      focus_recommendation TEXT,
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS memoirs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      script TEXT NOT NULL,
      narration_path TEXT,
      music_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, year)
    );

    CREATE INDEX IF NOT EXISTS idx_entries_user_date ON journal_entries(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_entries_user_created ON journal_entries(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_moments_user_date ON emotional_moments(user_id, moment_date);

    CREATE TABLE IF NOT EXISTS pending_session_users (
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  migrateSchema(database);
}

function migrateSchema(database: Database.Database) {
  const entryCols = database.prepare("PRAGMA table_info(journal_entries)").all() as {
    name: string;
  }[];
  if (!entryCols.some((c) => c.name === "open_thread")) {
    database.exec("ALTER TABLE journal_entries ADD COLUMN open_thread TEXT");
  }

  const weeklyCols = database.prepare("PRAGMA table_info(weekly_summaries)").all() as {
    name: string;
  }[];
  if (!weeklyCols.some((c) => c.name === "voice_script")) {
    database.exec("ALTER TABLE weekly_summaries ADD COLUMN voice_script TEXT");
  }
  if (!weeklyCols.some((c) => c.name === "audio_path")) {
    database.exec("ALTER TABLE weekly_summaries ADD COLUMN audio_path TEXT");
  }
  if (!weeklyCols.some((c) => c.name === "support_note")) {
    database.exec("ALTER TABLE weekly_summaries ADD COLUMN support_note TEXT");
  }

  const userCols = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.some((c) => c.name === "email")) {
    database.exec("ALTER TABLE users ADD COLUMN email TEXT");
  }
  if (!userCols.some((c) => c.name === "email_reminders_enabled")) {
    database.exec(
      "ALTER TABLE users ADD COLUMN email_reminders_enabled INTEGER NOT NULL DEFAULT 0"
    );
  }
  if (!userCols.some((c) => c.name === "timezone")) {
    database.exec("ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC'");
  }
  if (!userCols.some((c) => c.name === "last_reminder_sent_date")) {
    database.exec("ALTER TABLE users ADD COLUMN last_reminder_sent_date TEXT");
  }

  migrateJournalEntriesRestoreOnePerDay(database);
}

/** Re-enforce one entry per user per calendar date (demo spillover assigns the next free day). */
function migrateJournalEntriesRestoreOnePerDay(database: Database.Database) {
  const tableSql = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'journal_entries'")
    .get() as { sql: string } | undefined;

  if (!tableSql?.sql || tableSql.sql.includes("UNIQUE(user_id, entry_date)")) {
    return;
  }

  const userIds = database
    .prepare("SELECT DISTINCT user_id FROM journal_entries")
    .all() as { user_id: string }[];

  for (const { user_id } of userIds) {
    const entries = database
      .prepare(
        `SELECT id, entry_date FROM journal_entries
         WHERE user_id = ? ORDER BY created_at ASC`
      )
      .all(user_id) as { id: string; entry_date: string }[];

    const usedDates = new Set<string>();
    const bump = database.prepare("UPDATE journal_entries SET entry_date = ? WHERE id = ?");

    for (const entry of entries) {
      let date = entry.entry_date;
      while (usedDates.has(date)) {
        date = format(addDays(parseISO(date), 1), "yyyy-MM-dd");
      }
      if (date !== entry.entry_date) {
        bump.run(date, entry.id);
      }
      usedDates.add(date);
    }
  }

  database.exec(`
    CREATE TABLE journal_entries_one_per_day (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      transcript TEXT NOT NULL,
      summary TEXT,
      mood REAL,
      themes TEXT,
      open_thread TEXT,
      duration_seconds INTEGER DEFAULT 0,
      conversation_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, entry_date)
    );

    INSERT INTO journal_entries_one_per_day
      SELECT id, user_id, entry_date, transcript, summary, mood, themes, open_thread,
             duration_seconds, conversation_id, created_at
      FROM journal_entries;

    DROP TABLE journal_entries;
    ALTER TABLE journal_entries_one_per_day RENAME TO journal_entries;

    CREATE INDEX IF NOT EXISTS idx_entries_user_date ON journal_entries(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_entries_user_created ON journal_entries(user_id, created_at DESC);
  `);
}

export type JournalEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  transcript: string;
  summary: string | null;
  mood: number | null;
  themes: string | null;
  open_thread: string | null;
  duration_seconds: number;
  conversation_id: string | null;
  created_at: string;
};

export type EmotionalMoment = {
  id: string;
  user_id: string;
  entry_id: string | null;
  moment_date: string;
  description: string;
  emotion: string;
  intensity: number;
  created_at: string;
};

export type WeeklySummary = {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  summary: string;
  insights: string | null;
  voice_script: string | null;
  audio_path: string | null;
  created_at: string;
};

export type WorryThread = {
  id: string;
  title: string;
  summary: string;
  intensity: number;
  trend: "rising" | "stable" | "fading";
  mentionCount: number;
  firstSeen: string;
  lastSeen: string;
  focusPriority: number;
  suggestedActions: string[];
  relatedDates: string[];
};
