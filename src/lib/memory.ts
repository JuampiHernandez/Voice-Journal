import { v4 as uuid } from "uuid";
import { format, subDays, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";
import { getDb, type JournalEntry, type EmotionalMoment, type WorryThread } from "./db";

export function ensureUser(userId: string, name = "Journaler") {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!existing) {
    db.prepare("INSERT INTO users (id, name) VALUES (?, ?)").run(userId, name);
  }
}

export function getEntryForDate(userId: string, date: string): JournalEntry | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM journal_entries WHERE user_id = ? AND entry_date = ?")
    .get(userId, date) as JournalEntry | undefined;
}

/** First free calendar day starting today — bumps forward when today is already taken (demo spillover). */
export function resolveNextEntryDate(userId: string): string {
  let candidate = format(new Date(), "yyyy-MM-dd");
  while (getEntryForDate(userId, candidate)) {
    candidate = format(addDays(parseISO(candidate), 1), "yyyy-MM-dd");
  }
  return candidate;
}

export function getEntryById(userId: string, entryId: string): JournalEntry | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM journal_entries WHERE user_id = ? AND id = ?")
    .get(userId, entryId) as JournalEntry | undefined;
}

export function getRecentEntries(userId: string, limit = 7): JournalEntry[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT ?"
    )
    .all(userId, limit) as JournalEntry[];
}

export function getEmotionalMoments(userId: string, limit = 10): EmotionalMoment[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM emotional_moments WHERE user_id = ? ORDER BY moment_date DESC LIMIT ?"
    )
    .all(userId, limit) as EmotionalMoment[];
}

export function getStreak(userId: string): number {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT entry_date FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC"
    )
    .all(userId) as { entry_date: string }[];

  if (rows.length === 0) return 0;

  let streak = 0;
  let expected = format(new Date(), "yyyy-MM-dd");

  for (const row of rows) {
    if (row.entry_date === expected) {
      streak++;
      expected = format(subDays(parseISO(expected), 1), "yyyy-MM-dd");
    } else if (streak === 0 && row.entry_date === format(subDays(new Date(), 1), "yyyy-MM-dd")) {
      expected = format(subDays(parseISO(row.entry_date), 1), "yyyy-MM-dd");
      streak = 1;
    } else {
      break;
    }
  }
  return streak;
}

export function buildMemoryContext(userId: string): string {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const yesterdayEntry = getEntryForDate(userId, yesterday);
  const recentEntries = getRecentEntries(userId, 7);
  const emotionalMoments = getEmotionalMoments(userId, 5);
  const streak = getStreak(userId);

  const openThreads = recentEntries
    .map((e) => e.open_thread)
    .filter((t): t is string => !!t)
    .slice(0, 3);

  const lines: string[] = [
    `Today is ${today}. User streak: ${streak} day(s).`,
    "",
    "## SESSION RULES",
    "- 3-minute daily check-in. Be a companion: validate, then help with ONE useful next step.",
    "- Interrupt when they're looping or rambling — see agent instructions.",
    "- Ask one question at a time. Short responses.",
    "- Reference past entries — show you remember.",
    "- At ~2:30, wrap up. At 3:00, affirm and name one thread for tomorrow.",
    "",
  ];

  if (yesterdayEntry?.summary) {
    lines.push("## YESTERDAY", yesterdayEntry.summary, "");
    if (yesterdayEntry.open_thread) {
      lines.push(`Open thread to follow up: "${yesterdayEntry.open_thread}"`, "");
    }
  } else if (yesterdayEntry?.transcript) {
    lines.push("## YESTERDAY", truncate(yesterdayEntry.transcript, 400), "");
  }

  if (openThreads.length > 0) {
    lines.push("## OPEN THREADS FROM RECENT DAYS");
    for (const t of openThreads) {
      lines.push(`- ${t}`);
    }
    lines.push("");
  }

  const weekEntries = recentEntries.filter((e) => e.entry_date >= weekAgo);
  if (weekEntries.length > 0) {
    lines.push("## THIS PAST WEEK");
    for (const entry of weekEntries) {
      const themes = entry.themes ? JSON.parse(entry.themes) : [];
      lines.push(
        `- ${entry.entry_date}: ${entry.summary ?? truncate(entry.transcript, 120)}${
          entry.mood != null ? ` (mood: ${entry.mood.toFixed(1)}/10)` : ""
        }${themes.length ? ` [${themes.join(", ")}]` : ""}`
      );
    }
    lines.push("");
  }

  if (emotionalMoments.length > 0) {
    lines.push("## MEMORABLE EMOTIONAL MOMENTS (you own this memory — reference with care)");
    for (const m of emotionalMoments) {
      lines.push(
        `- ${m.moment_date}: ${m.description} (${m.emotion}, intensity ${m.intensity.toFixed(1)})`
      );
    }
    lines.push("");
  }

  const threadSnapshot = getWorryThreadSnapshot(userId);
  if (threadSnapshot?.threads.length) {
    const top = [...threadSnapshot.threads].sort((a, b) => a.focusPriority - b.focusPriority)[0];
    lines.push(
      "## ACTIVE WORRY THREAD (from their journal map)",
      `${top.title}: ${top.summary}`,
      `Suggested focus: ${threadSnapshot.focusRecommendation}`,
      ""
    );
  }

  if (recentEntries.length === 0) {
    lines.push(
      "## FIRST SESSION",
      "First check-in. Welcome warmly. You're here to listen and help them feel less alone — their words stay on their server, not ElevenLabs'."
    );
  }

  return lines.join("\n");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function saveJournalEntry(params: {
  userId: string;
  entryDate?: string;
  transcript: string;
  summary: string;
  mood: number;
  themes: string[];
  durationSeconds: number;
  conversationId?: string;
  /** When set, updates the same session row (e.g. placeholder → analyzed). */
  entryId?: string;
  emotionalMoments?: { description: string; emotion: string; intensity: number }[];
  openThread?: string | null;
  microAction?: string | null;
}) {
  const db = getDb();
  const themesJson = JSON.stringify(params.themes);

  let finalId: string;
  let entryDate: string;

  if (params.entryId) {
    const existing = getEntryById(params.userId, params.entryId);
    if (!existing) {
      throw new Error(`Journal entry not found: ${params.entryId}`);
    }
    entryDate = existing.entry_date;
    const updated = db
      .prepare(
        `UPDATE journal_entries SET
           transcript = ?,
           summary = ?,
           mood = ?,
           themes = ?,
           open_thread = ?,
           duration_seconds = ?,
           conversation_id = COALESCE(?, conversation_id)
         WHERE id = ? AND user_id = ?`
      )
      .run(
        params.transcript,
        params.summary,
        params.mood,
        themesJson,
        params.openThread ?? null,
        params.durationSeconds,
        params.conversationId ?? null,
        params.entryId,
        params.userId
      );
    finalId = params.entryId;
  } else {
    entryDate = params.entryDate ?? resolveNextEntryDate(params.userId);
    finalId = uuid();
    db.prepare(
      `INSERT INTO journal_entries (id, user_id, entry_date, transcript, summary, mood, themes, open_thread, duration_seconds, conversation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      finalId,
      params.userId,
      entryDate,
      params.transcript,
      params.summary,
      params.mood,
      themesJson,
      params.openThread ?? null,
      params.durationSeconds,
      params.conversationId ?? null
    );
    const saved = getEntryForDate(params.userId, entryDate);
    if (saved) finalId = saved.id;
  }

  if (params.emotionalMoments?.length) {
    db.prepare("DELETE FROM emotional_moments WHERE entry_id = ?").run(finalId);
    const insert = db.prepare(
      `INSERT INTO emotional_moments (id, user_id, entry_id, moment_date, description, emotion, intensity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const m of params.emotionalMoments) {
      insert.run(uuid(), params.userId, finalId, entryDate, m.description, m.emotion, m.intensity);
    }
  }

  return finalId;
}

export function getYearEntries(userId: string, year: number): JournalEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM journal_entries
       WHERE user_id = ? AND entry_date >= ? AND entry_date <= ?
       ORDER BY entry_date ASC`
    )
    .all(userId, `${year}-01-01`, `${year}-12-31`) as JournalEntry[];
}

export function getWeeklySummary(userId: string, weekStart: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM weekly_summaries WHERE user_id = ? AND week_start = ?")
    .get(userId, weekStart) as
    | {
        summary: string;
        insights: string | null;
        week_end: string;
        voice_script: string | null;
        audio_path: string | null;
        support_note: string | null;
      }
    | undefined;
}

export function saveWeeklySummary(
  userId: string,
  weekStart: string,
  weekEnd: string,
  summary: string,
  insights: string[],
  extras?: { supportNote?: string; voiceScript?: string; audioPath?: string }
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO weekly_summaries (id, user_id, week_start, week_end, summary, insights, support_note, voice_script, audio_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, week_start) DO UPDATE SET
       summary = excluded.summary,
       insights = excluded.insights,
       support_note = excluded.support_note,
       voice_script = COALESCE(excluded.voice_script, weekly_summaries.voice_script),
       audio_path = COALESCE(excluded.audio_path, weekly_summaries.audio_path)`
  ).run(
    uuid(),
    userId,
    weekStart,
    weekEnd,
    summary,
    JSON.stringify(insights),
    extras?.supportNote ?? null,
    extras?.voiceScript ?? null,
    extras?.audioPath ?? null
  );
}

export function saveWeeklyVoice(
  userId: string,
  weekStart: string,
  voiceScript: string,
  audioPath: string
) {
  const db = getDb();
  db.prepare(
    `UPDATE weekly_summaries SET voice_script = ?, audio_path = ? WHERE user_id = ? AND week_start = ?`
  ).run(voiceScript, audioPath, userId, weekStart);
}

export function getEntriesForRecap(userId: string, demoMode: boolean) {
  const entries = getRecentEntries(userId, demoMode ? 30 : 14);
  if (demoMode) {
    return entries.filter((e) => e.summary && e.summary !== "Processing your check-in…");
  }
  const { start, end } = getCurrentWeekRange();
  return entries.filter((e) => e.entry_date >= start && e.entry_date <= end);
}

export function getWorryThreadSnapshot(userId: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT threads_json, focus_recommendation, generated_at FROM worry_thread_snapshots WHERE user_id = ?")
    .get(userId) as
    | { threads_json: string; focus_recommendation: string; generated_at: string }
    | undefined;

  if (!row) return null;

  return {
    threads: JSON.parse(row.threads_json) as WorryThread[],
    focusRecommendation: row.focus_recommendation,
    generatedAt: row.generated_at,
  };
}

export function saveWorryThreadSnapshot(
  userId: string,
  threads: WorryThread[],
  focusRecommendation: string
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO worry_thread_snapshots (id, user_id, threads_json, focus_recommendation)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       threads_json = excluded.threads_json,
       focus_recommendation = excluded.focus_recommendation,
       generated_at = datetime('now')`
  ).run(uuid(), userId, JSON.stringify(threads), focusRecommendation);
}

export function getCurrentWeekRange() {
  const now = new Date();
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}
