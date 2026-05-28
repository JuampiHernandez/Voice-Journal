import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getYearEntries, getMemoir, saveMemoir } from "@/lib/memory";
import { generateMemoirScript } from "@/lib/analysis";
import { generateNarrationBuffer, generateMemoirMusicBuffer } from "@/lib/elevenlabs";
import { withJournalUser } from "@/lib/auth/api-context";
import { uploadAudio, memoirNarrationPath, memoirMusicPath } from "@/lib/storage";
import { rejectIfReadOnly } from "@/lib/auth/read-only";

export async function POST(request: NextRequest) {
  const blocked = rejectIfReadOnly("Memoir generation");
  if (blocked) return blocked;
  const body = (await request.json()) as { userId?: string; year?: number };
  const ctx = withJournalUser(request, body.userId);
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const year = body.year ?? new Date().getFullYear();

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
  const narrationStorage = memoirNarrationPath(userId, year);
  const musicStorage = memoirMusicPath(userId, year);

  try {
    const script = await generateMemoirScript(year, entries);
    const narrationBuffer = await generateNarrationBuffer(script);
    const musicBuffer = await generateMemoirMusicBuffer();
    uploadAudio(narrationStorage, narrationBuffer);
    uploadAudio(musicStorage, musicBuffer);

    saveMemoir({
      userId,
      year,
      script,
      narrationPath: narrationStorage,
      musicPath: musicStorage,
      memoirId,
    });

    return NextResponse.json({
      id: memoirId,
      year,
      script,
      narrationUrl: `/api/memoir/audio?userId=${encodeURIComponent(userId)}&year=${year}&type=narration`,
      musicUrl: `/api/memoir/audio?userId=${encodeURIComponent(userId)}&year=${year}&type=music`,
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
  const ctx = withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const memoir = getMemoir(userId, year);
  if (!memoir || memoir.status !== "ready") {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    year,
    script: memoir.script,
    narrationUrl: `/api/memoir/audio?userId=${encodeURIComponent(userId)}&year=${year}&type=narration`,
    musicUrl: `/api/memoir/audio?userId=${encodeURIComponent(userId)}&year=${year}&type=music`,
  });
}
