import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import "dotenv/config";
import { syncSpeechEngineWsUrl } from "../src/lib/speech-engine-sync";

async function detectNgrokWsUrl(): Promise<string | null> {
  for (const port of [4040, 4041, 4042]) {
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
        return tunnel.public_url.replace(/^https:/, "wss:").replace(/\/+$/, "") + "/ws";
      }
    } catch {
      // Try the next ngrok API port.
    }
  }
  return null;
}

function upsertEnv(values: Record<string, string>) {
  const path = ".env";
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = existing ? existing.split(/\r?\n/) : [];

  for (const [key, value] of Object.entries(values)) {
    const next = `${key}=${value}`;
    const index = lines.findIndex((line) => line.startsWith(`${key}=`));
    if (index >= 0) {
      lines[index] = next;
    } else {
      lines.push(next);
    }
  }

  writeFileSync(path, `${lines.filter(Boolean).join("\n")}\n`);
}

async function main() {
  const wsUrl = (await detectNgrokWsUrl()) || process.env.SPEECH_ENGINE_WS_URL;

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error("Missing ELEVENLABS_API_KEY in .env");
    process.exit(1);
  }

  if (!wsUrl) {
    console.error("Missing SPEECH_ENGINE_WS_URL and no ngrok tunnel was detected.");
    console.error("\nSteps (local):");
    console.error("  1. Start ngrok in another terminal: ngrok http 3002");
    console.error("  2. Re-run: npm run setup:speech-engine");
    process.exit(1);
  }

  const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  const { SPEECH_ENGINE_CONVERSATION_CONFIG } = await import("../src/lib/speech-engine-config");
  const existingEngineId = process.env.SPEECH_ENGINE_ID?.trim();

  if (existingEngineId) {
    process.env.SPEECH_ENGINE_WS_URL = wsUrl;
    const sync = await syncSpeechEngineWsUrl();
    if (!sync.ok) {
      console.error("✗", sync.error);
      process.exit(1);
    }
    upsertEnv({ SPEECH_ENGINE_ID: existingEngineId, SPEECH_ENGINE_WS_URL: wsUrl });
    console.log(`\n✓ Existing Speech Engine synced to ${wsUrl}`);
    console.log("Now run: npm run dev:full");
    return;
  }

  const engine = await elevenlabs.speechEngine.create({
    name: "Voice Journal",
    speechEngine: {
      wsUrl,
    },
    turn: SPEECH_ENGINE_CONVERSATION_CONFIG.turn,
    conversation: SPEECH_ENGINE_CONVERSATION_CONFIG.conversation,
    overrides: {
      firstMessage: true,
    },
  });

  console.log("\n✓ Speech Engine created!\n");
  upsertEnv({ SPEECH_ENGINE_ID: engine.engineId, SPEECH_ENGINE_WS_URL: wsUrl });
  console.log("Added this to your .env:\n");
  console.log(`SPEECH_ENGINE_ID=${engine.engineId}`);
  console.log(`SPEECH_ENGINE_WS_URL=${wsUrl}`);
  console.log("\nNow run: npm run dev:full");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
