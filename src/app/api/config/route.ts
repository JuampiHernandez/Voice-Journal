import { NextResponse } from "next/server";
import { getAppConfig } from "@/lib/config";
import { resolveSpeechEngineWsUrl, syncSpeechEngineWsUrl } from "@/lib/speech-engine-sync";
import { verifyPublicWsTunnel } from "@/lib/elevenlabs-conversation";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { guestJournalAllowed } from "@/lib/auth/resolve-user";

export async function GET() {
  const config = getAppConfig();
  const wsUrl = resolveSpeechEngineWsUrl() ?? process.env.SPEECH_ENGINE_WS_URL;

  let speechEngineHealth: { ok: boolean; error?: string } = { ok: false };

  if (wsUrl?.startsWith("wss://")) {
    const tunnel = await verifyPublicWsTunnel(wsUrl);
    speechEngineHealth = tunnel.reachable
      ? { ok: true }
      : { ok: false, error: tunnel.error ?? "Speech Engine tunnel unreachable" };
  } else {
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
  }

  const sync = await syncSpeechEngineWsUrl();

  return NextResponse.json({
    ...config,
    supabaseReady: isSupabaseConfigured(),
    guestJournalAllowed: guestJournalAllowed(),
    speechEngineHealth,
    speechEngineWsUrl: sync.expected ?? wsUrl,
    speechEngineWsSynced: sync.ok && !sync.updated,
    speechEngineWsUpdated: sync.updated ?? false,
    speechEngineTunnelReachable: sync.tunnelReachable ?? speechEngineHealth.ok,
    speechEngineTunnelError: sync.tunnelError ?? sync.error ?? speechEngineHealth.error ?? null,
    /** @deprecated use speechEngineTunnelReachable */
    ngrokTunnelReachable: sync.tunnelReachable ?? speechEngineHealth.ok,
    /** @deprecated use speechEngineTunnelError */
    ngrokTunnelError: sync.tunnelError ?? sync.error ?? speechEngineHealth.error ?? null,
    speechEngineId: process.env.SPEECH_ENGINE_ID ?? null,
  });
}
