import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { v4 as uuid } from "uuid";
import { ensureUser, getYearEntries } from "@/lib/memory";
import { generateMemoirScript } from "@/lib/analysis";
import { generateNarration, generateMemoirMusic } from "@/lib/elevenlabs";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { userId?: string; year?: number };
  const userId = body.userId ?? "demo-user";
  const year = body.year ?? new Date().getFullYear();

  ensureUser(userId);

  const entries = getYearEntries(userId, year).map((e) => ({
    date: e.entry_date,
    summary: e.summary ?? e.transcript.slice(0, 300),
    mood: e.mood,
    themes: e.themes ? JSON.parse(e.themes) : [],
  }));

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No journal entries for this year. Complete some check-ins first." },
      { status: 400 }
    );
  }

  if (!process.env.ELEVENLABS_API_KEY || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "API keys not configured" }, { status: 503 });
  }

  const memoirId = uuid();
  const outputDir = path.join(process.cwd(), "data", "memoirs", userId, String(year));

  try {
    const script = await generateMemoirScript(year, entries);
    const narrationPath = path.join(outputDir, "narration.mp3");
    const musicPath = path.join(outputDir, "music.mp3");

    await generateNarration(script, narrationPath);
    await generateMemoirMusic(musicPath);

    const db = getDb();
    db.prepare(
      `INSERT INTO memoirs (id, user_id, year, script, narration_path, music_path, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ready')
       ON CONFLICT(user_id, year) DO UPDATE SET
         script = excluded.script,
         narration_path = excluded.narration_path,
         music_path = excluded.music_path,
         status = 'ready'`
    ).run(memoirId, userId, year, script, narrationPath, musicPath);

    return NextResponse.json({
      id: memoirId,
      year,
      script,
      narrationUrl: `/api/memoir/audio?userId=${userId}&year=${year}&type=narration`,
      musicUrl: `/api/memoir/audio?userId=${userId}&year=${year}&type=music`,
      entryCount: entries.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Memoir generation failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const db = getDb();
  const memoir = db
    .prepare("SELECT * FROM memoirs WHERE user_id = ? AND year = ? AND status = 'ready'")
    .get(userId, year) as
    | { script: string; narration_path: string; music_path: string }
    | undefined;

  if (!memoir) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    year,
    script: memoir.script,
    narrationUrl: `/api/memoir/audio?userId=${userId}&year=${year}&type=narration`,
    musicUrl: `/api/memoir/audio?userId=${userId}&year=${year}&type=music`,
  });
}
