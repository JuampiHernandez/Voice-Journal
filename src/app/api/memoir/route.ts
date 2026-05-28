import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getYearEntries } from "@/lib/memory";
import { generateMemoirScript } from "@/lib/analysis";
import { generateNarrationBuffer, generateMemoirMusicBuffer } from "@/lib/elevenlabs";
import { createAdminClient } from "@/lib/supabase/admin";
import { withJournalUser } from "@/lib/auth/api-context";
import {
  uploadAudio,
  memoirNarrationPath,
  memoirMusicPath,
  getAudioSignedUrl,
} from "@/lib/storage";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { userId?: string; year?: number };
  const ctx = await withJournalUser(request, body.userId);
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const year = body.year ?? new Date().getFullYear();

  const entries = (await getYearEntries(userId, year)).map((e) => ({
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
    await uploadAudio(narrationStorage, narrationBuffer);
    await uploadAudio(musicStorage, musicBuffer);

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("memoirs")
      .select("id")
      .eq("user_id", userId)
      .eq("year", year)
      .maybeSingle();

    const row = {
      user_id: userId,
      year,
      script,
      narration_path: narrationStorage,
      music_path: musicStorage,
      status: "ready",
    };

    if (existing?.id) {
      await supabase.from("memoirs").update(row).eq("id", existing.id);
    } else {
      await supabase.from("memoirs").insert({ id: memoirId, ...row });
    }

    return NextResponse.json({
      id: memoirId,
      year,
      script,
      narrationUrl: `/api/memoir/audio?year=${year}&type=narration`,
      musicUrl: `/api/memoir/audio?year=${year}&type=music`,
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
  const ctx = await withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const { data: memoir } = await createAdminClient()
    .from("memoirs")
    .select("script, narration_path, music_path")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("status", "ready")
    .maybeSingle();

  if (!memoir) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    year,
    script: memoir.script,
    narrationUrl: `/api/memoir/audio?year=${year}&type=narration`,
    musicUrl: `/api/memoir/audio?year=${year}&type=music`,
  });
}
