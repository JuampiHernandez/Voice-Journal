import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentWeekRange,
  getEntriesForRecap,
  saveWeeklySummary,
  saveWeeklyVoice,
} from "@/lib/memory";
import { generateWeeklySummary, generateWeeklyVoiceScript } from "@/lib/analysis";
import { generateNarrationBuffer } from "@/lib/elevenlabs";
import { getAppConfig } from "@/lib/config";
import { withJournalUser } from "@/lib/auth/api-context";
import { uploadAudio, weeklyAudioPath } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    demo?: boolean;
    skipVoice?: boolean;
  };

  const ctx = await withJournalUser(
    request,
    body.userId ?? request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const demoMode = body.demo ?? request.nextUrl.searchParams.get("demo") === "true";
  const skipVoice = body.skipVoice ?? false;

  const config = getAppConfig();
  if (!config.openaiReady) {
    return NextResponse.json({ error: "OPENAI_API_KEY required" }, { status: 503 });
  }

  const rawEntries = await getEntriesForRecap(userId, demoMode);
  const entries = rawEntries
    .filter((e) => e.summary && e.summary !== "Processing your check-in…")
    .map((e) => ({
      date: e.entry_date,
      summary: e.summary ?? e.transcript.slice(0, 200),
      mood: e.mood,
      themes: e.themes ? JSON.parse(e.themes) : [],
      openThread: e.open_thread,
    }));

  if (entries.length === 0) {
    return NextResponse.json(
      {
        error: demoMode
          ? "No journal entries yet. Run a check-in or load demo week first."
          : "No entries this week yet. Use demo mode or complete a check-in.",
      },
      { status: 400 }
    );
  }

  const { start: weekStart, end: weekEnd } = getCurrentWeekRange();
  const label = demoMode ? "your journal so far" : "this week";

  try {
    const generated = await generateWeeklySummary(entries, { demoLabel: label });
    await saveWeeklySummary(userId, weekStart, weekEnd, generated.summary, generated.insights, {
      supportNote: generated.supportNote,
    });

    let audioUrl: string | null = null;
    let voiceScript: string | null = null;

    if (!skipVoice && config.elevenlabsReady) {
      voiceScript = await generateWeeklyVoiceScript(
        generated.summary,
        generated.insights,
        generated.supportNote
      );

      const buffer = await generateNarrationBuffer(voiceScript);
      const storagePath = weeklyAudioPath(userId, weekStart);
      await uploadAudio(storagePath, buffer);
      await saveWeeklyVoice(userId, weekStart, voiceScript, storagePath);
      audioUrl = `/api/weekly-summary/audio?weekStart=${weekStart}`;
    }

    return NextResponse.json({
      weekStart,
      weekEnd,
      summary: generated.summary,
      insights: generated.insights,
      supportNote: generated.supportNote,
      voiceScript,
      audioUrl,
      entryCount: entries.length,
      demoMode,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Weekly recap failed" },
      { status: 500 }
    );
  }
}
