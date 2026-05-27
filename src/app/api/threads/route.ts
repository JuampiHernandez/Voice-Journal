import { NextRequest, NextResponse } from "next/server";
import { ensureUser, getRecentEntries, getWorryThreadSnapshot, saveWorryThreadSnapshot } from "@/lib/memory";
import { generateWorryThreads } from "@/lib/analysis";
import { getAppConfig } from "@/lib/config";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
  ensureUser(userId);

  const snapshot = getWorryThreadSnapshot(userId);
  if (!snapshot) {
    return NextResponse.json({
      threads: [],
      focusRecommendation: null,
      generatedAt: null,
    });
  }

  return NextResponse.json(snapshot);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { userId?: string };
  const userId = body.userId ?? "demo-user";
  ensureUser(userId);

  const config = getAppConfig();
  if (!config.openaiReady) {
    return NextResponse.json({ error: "OPENAI_API_KEY required" }, { status: 503 });
  }

  const entries = getRecentEntries(userId, 30)
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
    const { threads, focusRecommendation } = await generateWorryThreads(entries);
    saveWorryThreadSnapshot(userId, threads, focusRecommendation);

    return NextResponse.json({
      threads,
      focusRecommendation,
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
