-- Voice Journal schema for Supabase Postgres

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Journaler',
  email TEXT,
  check_in_time TEXT NOT NULL DEFAULT '21:00',
  email_reminders_enabled BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  last_reminder_sent_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  transcript TEXT NOT NULL,
  summary TEXT,
  mood REAL,
  themes TEXT,
  open_thread TEXT,
  duration_seconds INTEGER DEFAULT 0,
  conversation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE TABLE IF NOT EXISTS emotional_moments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id TEXT REFERENCES journal_entries(id) ON DELETE CASCADE,
  moment_date DATE NOT NULL,
  description TEXT NOT NULL,
  emotion TEXT NOT NULL,
  intensity REAL NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weekly_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary TEXT NOT NULL,
  insights TEXT,
  support_note TEXT,
  voice_script TEXT,
  audio_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS worry_thread_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  threads_json TEXT NOT NULL,
  focus_recommendation TEXT,
  bright_threads_json TEXT NOT NULL DEFAULT '[]',
  celebrate_recommendation TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memoirs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  script TEXT NOT NULL,
  narration_path TEXT,
  music_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, year)
);

CREATE TABLE IF NOT EXISTS pending_session_users (
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entries_user_date ON journal_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_user_date ON emotional_moments(user_id, moment_date);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE worry_thread_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_session_users ENABLE ROW LEVEL SECURITY;

-- Authenticated users access only their rows (user_id = auth.uid()::text)
CREATE POLICY users_select_own ON users FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY users_insert_own ON users FOR INSERT WITH CHECK (id = auth.uid()::text);
CREATE POLICY users_update_own ON users FOR UPDATE USING (id = auth.uid()::text);

CREATE POLICY entries_all_own ON journal_entries
  FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY moments_all_own ON emotional_moments
  FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY weekly_all_own ON weekly_summaries
  FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY threads_all_own ON worry_thread_snapshots
  FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY memoirs_all_own ON memoirs
  FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Storage bucket (run in dashboard or via API): journal-audio, private
-- Service role used from Next.js API bypasses RLS.
