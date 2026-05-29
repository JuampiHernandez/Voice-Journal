import { NextRequest, NextResponse } from "next/server";
import {
  getRecentEntries,
  getWeeklySummary,
  saveWeeklySummary,
  getCurrentWeekRange,
} from "@/lib/memory";
import { generateWeeklySummary } from "@/lib/analysis";
import { getAppConfig } from "@/lib/config";
import { withJournalUser } from "@/lib/auth/api-context";
import { isReadOnlyRuntime } from "@/lib/runtime";

export async function GET(request: NextRequest) {
  const ctx = withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const { start } = getCurrentWeekRange();
  const existing = getWeeklySummary(userId, start);

  if (existing) {
    return NextResponse.json({
      weekStart: start,
      weekEnd: existing.week_end,
      summary: existing.summary,
      insights: existing.insights ? JSON.parse(existing.insights) : [],
      supportNote: existing.support_note ?? null,
      audioUrl: existing.audio_path
        ? `/api/weekly-summary/audio?userId=${encodeURIComponent(userId)}&weekStart=${start}`
        : null,
      cached: true,
    });
  }

  const { start: weekStart, end: weekEnd } = getCurrentWeekRange();
  const entries = (getRecentEntries(userId, 7))
    .filter((e) => e.entry_date >= weekStart && e.entry_date <= weekEnd)
    .map((e) => ({
      date: e.entry_date,
      summary: e.summary ?? e.transcript.slice(0, 200),
      mood: e.mood,
      themes: e.themes ? JSON.parse(e.themes) : [],
    }));

  if (entries.length === 0) {
    return NextResponse.json({
      weekStart,
      weekEnd,
      summary:
        "No entries this week yet. Complete a few daily check-ins to unlock your weekly recap.",
      insights: [],
      cached: false,
    });
  }

  const config = getAppConfig();
  if (!config.openaiReady) {
    return NextResponse.json({ error: "OPENAI_API_KEY required" }, { status: 503 });
  }

  if (isReadOnlyRuntime()) {
    return NextResponse.json({
      weekStart,
      weekEnd,
      summary: "Weekly recap is preloaded for showcase journals on the deployed demo.",
      insights: [],
      cached: false,
    });
  }

  try {
    const generated = await generateWeeklySummary(entries);
    saveWeeklySummary(userId, weekStart, weekEnd, generated.summary, generated.insights);

    return NextResponse.json({
      weekStart,
      weekEnd,
      summary: generated.summary,
      insights: generated.insights,
      cached: false,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summary generation failed" },
      { status: 500 }
    );
  }
}
