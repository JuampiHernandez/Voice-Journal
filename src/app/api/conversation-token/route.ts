import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/lib/config";

export async function GET(request: NextRequest) {
  const config = getAppConfig();

  if (!config.speechEngineReady) {
    return NextResponse.json(
      {
        error: "Speech Engine not configured",
        missing: config.missing,
        hint: "Run: npm run speech-engine + ngrok http 3002 + npm run setup:speech-engine",
      },
      { status: 503 }
    );
  }

  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
  const { registerPendingSessionUser } = await import("@/lib/session-user");
  const { syncSpeechEngineWsUrl } = await import("@/lib/speech-engine-sync");
  registerPendingSessionUser(userId);

  const sync = await syncSpeechEngineWsUrl();
  if (sync.updated) {
    console.log(`[conversation-token] synced wsUrl → ${sync.expected}`);
  }
  if (!sync.tunnelReachable) {
    console.warn(`[conversation-token] ngrok tunnel offline: ${sync.tunnelError}`);
  }

  const participantName = encodeURIComponent(userId);
  const speechEngineId = process.env.SPEECH_ENGINE_ID!;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${speechEngineId}&participant_name=${participantName}`,
      { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const body = (await res.json()) as { token: string };
    return NextResponse.json({ token: body.token, speechEngineId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Token request failed" },
      { status: 500 }
    );
  }
}
