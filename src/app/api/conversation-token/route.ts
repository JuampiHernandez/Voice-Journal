import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/lib/config";
import { registerPendingSessionUser } from "@/lib/session-user";
import { syncSpeechEngineWsUrl } from "@/lib/speech-engine-sync";
import { withJournalUser } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const config = getAppConfig();

  if (!config.speechEngineReady) {
    return NextResponse.json(
      {
        error: "Speech Engine not configured",
        missing: config.missing,
        hint: "Deploy speech-engine (Railway/Fly) and set SPEECH_ENGINE_WS_URL, or run locally with ngrok",
      },
      { status: 503 }
    );
  }

  const ctx = await withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  await registerPendingSessionUser(userId);

  const sync = await syncSpeechEngineWsUrl();
  if (sync.updated) {
    console.log(`[conversation-token] synced wsUrl → ${sync.expected}`);
  }
  if (!sync.tunnelReachable) {
    console.warn(`[conversation-token] speech-engine tunnel offline: ${sync.tunnelError}`);
  }

  const speechEngineId = process.env.SPEECH_ENGINE_ID!;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${speechEngineId}`,
      { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const body = (await res.json()) as { signed_url?: string; signedUrl?: string };
    const signedUrl = body.signed_url ?? body.signedUrl;
    if (!signedUrl) {
      return NextResponse.json({ error: "Signed URL missing from ElevenLabs response" }, { status: 502 });
    }

    return NextResponse.json({ signedUrl, speechEngineId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Signed URL request failed" },
      { status: 500 }
    );
  }
}
