import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { verifyPublicWsTunnel } from "./elevenlabs-conversation";
import { syncSpeechEngineConversationConfig } from "./speech-engine-config";

async function detectNgrokWsUrl(): Promise<string | null> {
  for (const port of [4040, 4041, 4042, 4043, 4044, 4045]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/tunnels`, {
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as {
        tunnels?: { public_url?: string; config?: { addr?: string } }[];
      };
      const tunnel = body.tunnels?.find((t) => t.config?.addr?.includes("3002"));
      if (tunnel?.public_url) {
        return tunnel.public_url.replace(/^https:/, "wss:") + "/ws";
      }
    } catch {
      // ngrok API not available on this port
    }
  }
  return null;
}

/** Keep ElevenLabs Speech Engine wsUrl in sync with live ngrok tunnel */
export async function syncSpeechEngineWsUrl(): Promise<{
  ok: boolean;
  registered?: string;
  expected?: string;
  updated?: boolean;
  tunnelReachable?: boolean;
  tunnelError?: string;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const engineId = process.env.SPEECH_ENGINE_ID;
  let expected = process.env.SPEECH_ENGINE_WS_URL?.trim();

  if (!apiKey || !engineId) {
    return { ok: false, error: "Missing ELEVENLABS_API_KEY or SPEECH_ENGINE_ID" };
  }

  const detected = await detectNgrokWsUrl();
  if (detected && detected !== expected) {
    console.log(`[speech-engine-sync] using ngrok URL: ${detected}`);
    expected = detected;
  }

  if (!expected) {
    return { ok: false, error: "Missing SPEECH_ENGINE_WS_URL and ngrok tunnel not detected" };
  }

  if (!expected.startsWith("wss://")) {
    return { ok: false, error: "Speech Engine wsUrl must start with wss://" };
  }

  const tunnel = await verifyPublicWsTunnel(expected);

  const elevenlabs = new ElevenLabsClient({ apiKey });
  await syncSpeechEngineConversationConfig();

  try {
    const engine = await elevenlabs.speechEngine.get(engineId);
    const registered = engine.config?.speechEngine?.wsUrl ?? "";

    if (registered !== expected) {
      await elevenlabs.speechEngine.update(engineId, {
        speechEngine: { wsUrl: expected },
      });
      return {
        ok: tunnel.reachable,
        registered,
        expected,
        updated: true,
        tunnelReachable: tunnel.reachable,
        tunnelError: tunnel.error,
        error: tunnel.reachable
          ? undefined
          : `Updated wsUrl but tunnel unreachable: ${tunnel.error}`,
      };
    }

    return {
      ok: tunnel.reachable,
      registered,
      expected,
      updated: false,
      tunnelReachable: tunnel.reachable,
      tunnelError: tunnel.error,
      error: tunnel.reachable ? undefined : tunnel.error,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to sync Speech Engine URL",
      tunnelReachable: tunnel.reachable,
      tunnelError: tunnel.error,
    };
  }
}
