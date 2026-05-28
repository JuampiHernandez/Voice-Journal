import { NextRequest, NextResponse } from "next/server";
import { getRecentEntries, getWorryThreadSnapshot, saveWorryThreadSnapshot } from "@/lib/memory";
import { generateMindThreads } from "@/lib/analysis";
import { getAppConfig } from "@/lib/config";
import { withJournalUser } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const ctx = await withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const snapshot = await getWorryThreadSnapshot(userId);
  if (!snapshot) {
    return NextResponse.json({
      threads: [],
      focusRecommendation: null,
      brightThreads: [],
      celebrateRecommendation: null,
      generatedAt: null,
    });
  }

  return NextResponse.json(snapshot);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { userId?: string };
  const ctx = await withJournalUser(request, body.userId);
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const config = getAppConfig();
  if (!config.openaiReady) {
    return NextResponse.json({ error: "OPENAI_API_KEY required" }, { status: 503 });
  }

  const entries = (await getRecentEntries(userId, 30))
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
      { error: "No entries to analyze. Complete check-ins or load demo week." },
      { status: 400 }
    );
  }

  try {
    const { threads, focusRecommendation, brightThreads, celebrateRecommendation } =
      await generateMindThreads(entries);
    await saveWorryThreadSnapshot(
      userId,
      threads,
      focusRecommendation,
      brightThreads,
      celebrateRecommendation
    );

    return NextResponse.json({
      threads,
      focusRecommendation,
      brightThreads,
      celebrateRecommendation,
      generatedAt: new Date().toISOString(),
      entryCount: entries.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Thread analysis failed" },
      { status: 500 }
    );
  }
}
