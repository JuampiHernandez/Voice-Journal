import { NextRequest, NextResponse } from "next/server";
import {
  getRecentEntries,
  getEmotionalMoments,
  getStreak,
  getEntryForDate,
} from "@/lib/memory";
import { withJournalUser } from "@/lib/auth/api-context";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const ctx = withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const entries = getRecentEntries(userId, 30);
  const moments = getEmotionalMoments(userId, 20);
  const streak = getStreak(userId);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntry = getEntryForDate(userId, today);

  return NextResponse.json({
    streak,
    todayCompleted: !!todayEntry,
    entries: entries.map((e) => ({
      id: e.id,
      date: e.entry_date,
      createdAt: e.created_at,
      summary: e.summary,
      mood: e.mood,
      themes: e.themes ? JSON.parse(e.themes) : [],
      durationSeconds: e.duration_seconds,
    })),
    emotionalMoments: moments.map((m) => ({
      date: m.moment_date,
      description: m.description,
      emotion: m.emotion,
      intensity: m.intensity,
    })),
  });
}
