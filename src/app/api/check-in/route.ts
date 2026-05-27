import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { ensureUser, getEntryById, saveJournalEntry } from "@/lib/memory";
import { getAppConfig } from "@/lib/config";
import { analyzeTranscript } from "@/lib/analysis";

/** Save a check-in from the browser (backup when Speech Engine WS misses transcripts) */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    userId?: string;
    transcript?: string;
    durationSeconds?: number;
    conversationId?: string;
  };

  const userId = body.userId ?? "demo-user";
  const transcript = body.transcript?.trim() ?? "";
  const durationSeconds = body.durationSeconds ?? 180;

  if (!transcript) {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
  }

  const config = getAppConfig();
  if (!config.openaiReady) {
    return NextResponse.json({ error: "OPENAI_API_KEY required" }, { status: 503 });
  }

  ensureUser(userId);

  try {
    const analysis = await analyzeTranscript(transcript);

    const entryId = saveJournalEntry({
      userId,
      transcript,
      summary: analysis.summary,
      mood: analysis.mood,
      themes: analysis.themes,
      durationSeconds,
      conversationId: body.conversationId,
      emotionalMoments: analysis.emotionalMoments,
      openThread: analysis.openThread,
    });

    const saved = getEntryById(userId, entryId);

    return NextResponse.json({
      saved: true,
      entryId,
      entryDate: saved?.entry_date,
      summary: analysis.summary,
      note:
        saved?.entry_date && saved.entry_date !== format(new Date(), "yyyy-MM-dd")
          ? `Stored as ${saved.entry_date} (today already had a check-in)`
          : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Check-in failed" },
      { status: 500 }
    );
  }
}
