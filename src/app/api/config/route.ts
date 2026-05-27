import { NextResponse } from "next/server";
import { getAppConfig } from "@/lib/config";
import { syncSpeechEngineWsUrl } from "@/lib/speech-engine-sync";

export async function GET() {
  const config = getAppConfig();

  let speechEngineHealth: { ok: boolean; error?: string } = { ok: false };
  try {
    const port = process.env.SPEECH_ENGINE_PORT ?? "3002";
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    speechEngineHealth = { ok: res.ok };
  } catch (err) {
    speechEngineHealth = {
      ok: false,
      error: err instanceof Error ? err.message : "Speech engine unreachable",
    };
  }

  const sync = await syncSpeechEngineWsUrl();

    return NextResponse.json({
    ...config,
    speechEngineHealth,
    speechEngineWsUrl: sync.expected ?? process.env.SPEECH_ENGINE_WS_URL,
    speechEngineWsSynced: sync.ok && !sync.updated,
    speechEngineWsUpdated: sync.updated ?? false,
    ngrokTunnelReachable: sync.tunnelReachable ?? false,
    ngrokTunnelError: sync.tunnelError ?? sync.error ?? null,
    speechEngineId: process.env.SPEECH_ENGINE_ID ?? null,
  });
}
