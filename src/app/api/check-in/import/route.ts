import { NextRequest, NextResponse } from "next/server";
import { ensureUser, getEntryById, saveJournalEntry } from "@/lib/memory";
import { analyzeTranscript } from "@/lib/analysis";
import { fetchConversationUserTranscript } from "@/lib/elevenlabs-conversation";

/** Import user transcript from ElevenLabs conversation API (fallback when Speech Engine WS fails) */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    userId?: string;
    conversationId?: string;
    durationSeconds?: number;
  };

  const userId = body.userId ?? "demo-user";
  const conversationId = body.conversationId?.trim();

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

  const fetched = await fetchConversationUserTranscript(conversationId);
  if (!fetched?.transcript) {
    return NextResponse.json(
      {
        saved: false,
        error: fetched?.error ?? "No user transcript found in ElevenLabs conversation",
        elevenLabsStatus: fetched?.status,
      },
      { status: 404 }
    );
  }

  ensureUser(userId);
  const durationSeconds = body.durationSeconds ?? 180;

  try {
    const analysis = await analyzeTranscript(fetched.transcript);
    const entryId = saveJournalEntry({
      userId,
      transcript: fetched.transcript,
      summary: analysis.summary,
      mood: analysis.mood,
      themes: analysis.themes,
      durationSeconds,
      conversationId,
      emotionalMoments: analysis.emotionalMoments,
      openThread: analysis.openThread,
    });

    const saved = getEntryById(userId, entryId);

    return NextResponse.json({
      saved: true,
      source: "elevenlabs_api",
      entryId,
      entryDate: saved?.entry_date,
      summary: analysis.summary,
      elevenLabsStatus: fetched.status,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
