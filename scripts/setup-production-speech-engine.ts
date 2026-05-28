/**
 * One-time production setup: register Speech Engine with ElevenLabs and sync wsUrl.
 *
 * Usage (after Railway domain is live):
 *   SPEECH_ENGINE_WS_URL=wss://your-app.up.railway.app/ws npm run setup:production
 *
 * Or with Railway CLI linked:
 *   railway run npm run setup:production
 */
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import { SPEECH_ENGINE_CONVERSATION_CONFIG } from "../src/lib/speech-engine-config";
import { resolveSpeechEngineWsUrl, syncSpeechEngineWsUrl } from "../src/lib/speech-engine-sync";

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("Missing ELEVENLABS_API_KEY");
    process.exit(1);
  }

  const wsUrl = resolveSpeechEngineWsUrl();
  if (!wsUrl) {
    console.error("Missing public WebSocket URL.");
    console.error("");
    console.error("Set one of:");
    console.error("  SPEECH_ENGINE_WS_URL=wss://YOUR-RAILWAY-DOMAIN.up.railway.app/ws");
    console.error("  RAILWAY_PUBLIC_DOMAIN=YOUR-RAILWAY-DOMAIN.up.railway.app  (when using railway run)");
    process.exit(1);
  }

  const elevenlabs = new ElevenLabsClient({ apiKey });
  let engineId = process.env.SPEECH_ENGINE_ID?.trim();

  if (!engineId) {
    console.log(`Creating Speech Engine with wsUrl: ${wsUrl}`);
    const engine = await elevenlabs.speechEngine.create({
      name: "Voice Journal",
      speechEngine: { wsUrl },
      turn: SPEECH_ENGINE_CONVERSATION_CONFIG.turn,
      conversation: SPEECH_ENGINE_CONVERSATION_CONFIG.conversation,
      overrides: { firstMessage: true },
    });
    engineId = engine.engineId;
    console.log("\n✓ Speech Engine created\n");
    console.log(`SPEECH_ENGINE_ID=${engineId}`);
  } else {
    console.log(`Syncing existing Speech Engine (${engineId}) → ${wsUrl}`);
    process.env.SPEECH_ENGINE_ID = engineId;
    process.env.SPEECH_ENGINE_WS_URL = wsUrl;
    const sync = await syncSpeechEngineWsUrl();
    if (!sync.ok) {
      console.error("✗", sync.error);
      process.exit(1);
    }
    console.log(sync.updated ? `✓ Updated wsUrl → ${wsUrl}` : `✓ wsUrl already ${wsUrl}`);
  }

  console.log("\n--- Add these to Railway AND Vercel ---\n");
  console.log(`SPEECH_ENGINE_ID=${engineId}`);
  console.log(`SPEECH_ENGINE_WS_URL=${wsUrl}`);
  console.log("\nRailway also needs: ELEVENLABS_API_KEY, OPENAI_API_KEY,");
  console.log("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  console.log("\nVercel also needs: ALLOW_GUEST_JOURNAL=true (for judge demos)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
