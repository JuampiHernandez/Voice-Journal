import { NextResponse } from "next/server";
import { getAppConfig } from "@/lib/config";
import { resolveSpeechEngineWsUrl, syncSpeechEngineWsUrl } from "@/lib/speech-engine-sync";
import { verifyPublicWsTunnel } from "@/lib/elevenlabs-conversation";
import { isReadOnlyRuntime } from "@/lib/runtime";
import { SHOWCASE_USERS } from "@/lib/showcase-users";

export async function GET() {
  const config = getAppConfig();
  const envWsUrl = resolveSpeechEngineWsUrl() ?? process.env.SPEECH_ENGINE_WS_URL;
  const sync = await syncSpeechEngineWsUrl();
  const wsUrl = sync.expected ?? envWsUrl;

  let speechEngineHealth: { ok: boolean; error?: string } = { ok: false };

  if (sync.expected) {
    speechEngineHealth = sync.tunnelReachable
      ? { ok: true }
      : { ok: false, error: sync.tunnelError ?? sync.error ?? "Speech Engine tunnel unreachable" };
  } else if (wsUrl?.startsWith("wss://")) {
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

  const tunnelReachable = sync.tunnelReachable ?? speechEngineHealth.ok;
  const tunnelError = tunnelReachable
    ? null
    : sync.tunnelError ?? sync.error ?? speechEngineHealth.error ?? null;

  return NextResponse.json({
    ...config,
    readOnly: isReadOnlyRuntime(),
    showcaseUsers: SHOWCASE_USERS,
    speechEngineHealth,
    speechEngineWsUrl: wsUrl,
    speechEngineTunnelReachable: tunnelReachable,
    speechEngineTunnelError: tunnelError,
    speechEngineId: process.env.SPEECH_ENGINE_ID ?? null,
  });
}
