import { v4 as uuid } from "uuid";
import { format, subDays, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JournalEntry, EmotionalMoment, WorryThread, BrightThread } from "@/lib/types";

export type { JournalEntry, EmotionalMoment, WorryThread, BrightThread } from "@/lib/types";

function db() {
  return createAdminClient();
}

export async function ensureUser(userId: string, name = "Journaler", email?: string | null) {
  const supabase = db();
  const { data: existing } = await supabase.from("users").select("id").eq("id", userId).maybeSingle();
  if (!existing) {
    await supabase.from("users").insert({ id: userId, name, email: email ?? null });
  }
}

export async function getEntryForDate(
  userId: string,
  date: string
): Promise<JournalEntry | undefined> {
  const { data } = await db()
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .maybeSingle();
  return data as JournalEntry | undefined;
}

export async function resolveNextEntryDate(userId: string): Promise<string> {
  let candidate = format(new Date(), "yyyy-MM-dd");
  while (await getEntryForDate(userId, candidate)) {
    candidate = format(addDays(parseISO(candidate), 1), "yyyy-MM-dd");
  }
  return candidate;
}

export async function getEntryById(
  userId: string,
  entryId: string
): Promise<JournalEntry | undefined> {
  const { data } = await db()
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("id", entryId)
    .maybeSingle();
  return data as JournalEntry | undefined;
}

export async function getRecentEntries(userId: string, limit = 7): Promise<JournalEntry[]> {
  const { data } = await db()
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as JournalEntry[];
}

export async function getEmotionalMoments(
  userId: string,
  limit = 10
): Promise<EmotionalMoment[]> {
  const { data } = await db()
    .from("emotional_moments")
    .select("*")
    .eq("user_id", userId)
    .order("moment_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as EmotionalMoment[];
}

export async function getStreak(userId: string): Promise<number> {
  const { data: rows } = await db()
    .from("journal_entries")
    .select("entry_date")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });

  if (!rows?.length) return 0;

  let streak = 0;
  let expected = format(new Date(), "yyyy-MM-dd");

  for (const row of rows) {
    const entryDate = row.entry_date as string;
    if (entryDate === expected) {
      streak++;
      expected = format(subDays(parseISO(expected), 1), "yyyy-MM-dd");
    } else if (streak === 0 && entryDate === format(subDays(new Date(), 1), "yyyy-MM-dd")) {
      expected = format(subDays(parseISO(entryDate), 1), "yyyy-MM-dd");
      streak = 1;
    } else {
      break;
    }
  }
  return streak;
}

export async function buildMemoryContext(userId: string): Promise<string> {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const yesterdayEntry = await getEntryForDate(userId, yesterday);
  const recentEntries = await getRecentEntries(userId, 7);
  const emotionalMoments = await getEmotionalMoments(userId, 5);
  const streak = await getStreak(userId);

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

  const threadSnapshot = await getWorryThreadSnapshot(userId);
  if (threadSnapshot?.threads.length) {
    const top = [...threadSnapshot.threads].sort((a, b) => a.focusPriority - b.focusPriority)[0];
    lines.push(
      "## ACTIVE WORRY THREAD (from their journal map)",
      `${top.title}: ${top.summary}`,
      `Suggested focus: ${threadSnapshot.focusRecommendation}`,
      ""
    );
  }

  if (threadSnapshot?.brightThreads.length) {
    const top = [...threadSnapshot.brightThreads].sort(
      (a, b) => a.focusPriority - b.focusPriority
    )[0];
    lines.push(
      "## BRIGHT THREAD (from their journal map)",
      `${top.title}: ${top.summary}`,
      `Celebrate: ${threadSnapshot.celebrateRecommendation}`,
      ""
    );
  }

  if (recentEntries.length === 0) {
    lines.push(
      "## FIRST SESSION",
      "First check-in. Welcome warmly. You're here to listen and help them feel less alone — their words stay in your database, not ElevenAgents memory."
    );
  }

  return lines.join("\n");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export async function saveJournalEntry(params: {
  userId: string;
  entryDate?: string;
  transcript: string;
  summary: string;
  mood: number;
  themes: string[];
  durationSeconds: number;
  conversationId?: string;
  entryId?: string;
  emotionalMoments?: { description: string; emotion: string; intensity: number }[];
  openThread?: string | null;
  microAction?: string | null;
}) {
  const supabase = db();
  const themesJson = JSON.stringify(params.themes);

  let finalId: string;
  let entryDate: string;

  if (params.entryId) {
    const existing = await getEntryById(params.userId, params.entryId);
    if (!existing) {
      throw new Error(`Journal entry not found: ${params.entryId}`);
    }
    entryDate = existing.entry_date;
    await supabase
      .from("journal_entries")
      .update({
        transcript: params.transcript,
        summary: params.summary,
        mood: params.mood,
        themes: themesJson,
        open_thread: params.openThread ?? null,
        duration_seconds: params.durationSeconds,
        conversation_id: params.conversationId ?? existing.conversation_id,
      })
      .eq("id", params.entryId)
      .eq("user_id", params.userId);
    finalId = params.entryId;
  } else {
    entryDate = params.entryDate ?? (await resolveNextEntryDate(params.userId));
    finalId = uuid();
    const { data: saved, error } = await supabase
      .from("journal_entries")
      .insert({
        id: finalId,
        user_id: params.userId,
        entry_date: entryDate,
        transcript: params.transcript,
        summary: params.summary,
        mood: params.mood,
        themes: themesJson,
        open_thread: params.openThread ?? null,
        duration_seconds: params.durationSeconds,
        conversation_id: params.conversationId ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    finalId = saved?.id ?? finalId;
  }

  if (params.emotionalMoments?.length) {
    await supabase.from("emotional_moments").delete().eq("entry_id", finalId);
    await supabase.from("emotional_moments").insert(
      params.emotionalMoments.map((m) => ({
        id: uuid(),
        user_id: params.userId,
        entry_id: finalId,
        moment_date: entryDate,
        description: m.description,
        emotion: m.emotion,
        intensity: m.intensity,
      }))
    );
  }

  return finalId;
}

export async function getYearEntries(userId: string, year: number): Promise<JournalEntry[]> {
  const { data } = await db()
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", `${year}-01-01`)
    .lte("entry_date", `${year}-12-31`)
    .order("entry_date", { ascending: true });
  return (data ?? []) as JournalEntry[];
}

export async function getWeeklySummary(userId: string, weekStart: string) {
  const { data } = await db()
    .from("weekly_summaries")
    .select("summary, insights, week_end, voice_script, audio_path, support_note")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  return data as
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

export async function saveWeeklySummary(
  userId: string,
  weekStart: string,
  weekEnd: string,
  summary: string,
  insights: string[],
  extras?: { supportNote?: string; voiceScript?: string; audioPath?: string }
) {
  const supabase = db();
  const { data: existing } = await supabase
    .from("weekly_summaries")
    .select("id, voice_script, audio_path")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  const row = {
    user_id: userId,
    week_start: weekStart,
    week_end: weekEnd,
    summary,
    insights: JSON.stringify(insights),
    support_note: extras?.supportNote ?? null,
    voice_script: extras?.voiceScript ?? existing?.voice_script ?? null,
    audio_path: extras?.audioPath ?? existing?.audio_path ?? null,
  };

  if (existing?.id) {
    await supabase.from("weekly_summaries").update(row).eq("id", existing.id);
  } else {
    await supabase.from("weekly_summaries").insert({ id: uuid(), ...row });
  }
}

export async function saveWeeklyVoice(
  userId: string,
  weekStart: string,
  voiceScript: string,
  audioPath: string
) {
  await db()
    .from("weekly_summaries")
    .update({ voice_script: voiceScript, audio_path: audioPath })
    .eq("user_id", userId)
    .eq("week_start", weekStart);
}

export async function getEntriesForRecap(userId: string, demoMode: boolean) {
  const entries = await getRecentEntries(userId, demoMode ? 30 : 14);
  if (demoMode) {
    return entries.filter((e) => e.summary && e.summary !== "Processing your check-in…");
  }
  const { start, end } = getCurrentWeekRange();
  return entries.filter((e) => e.entry_date >= start && e.entry_date <= end);
}

export async function getWorryThreadSnapshot(userId: string) {
  const { data: row } = await db()
    .from("worry_thread_snapshots")
    .select(
      "threads_json, focus_recommendation, bright_threads_json, celebrate_recommendation, generated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) return null;

  return {
    threads: JSON.parse(row.threads_json as string) as WorryThread[],
    focusRecommendation: row.focus_recommendation as string,
    brightThreads: JSON.parse((row.bright_threads_json as string) ?? "[]") as BrightThread[],
    celebrateRecommendation: row.celebrate_recommendation as string | null,
    generatedAt: row.generated_at as string,
  };
}

export async function saveWorryThreadSnapshot(
  userId: string,
  threads: WorryThread[],
  focusRecommendation: string,
  brightThreads: BrightThread[] = [],
  celebrateRecommendation: string | null = null
) {
  const supabase = db();
  const payload = {
    threads_json: JSON.stringify(threads),
    focus_recommendation: focusRecommendation,
    bright_threads_json: JSON.stringify(brightThreads),
    celebrate_recommendation: celebrateRecommendation,
    generated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("worry_thread_snapshots")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("worry_thread_snapshots").update(payload).eq("user_id", userId);
  } else {
    await supabase
      .from("worry_thread_snapshots")
      .insert({ id: uuid(), user_id: userId, ...payload });
  }
}

export function getCurrentWeekRange() {
  const now = new Date();
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}
