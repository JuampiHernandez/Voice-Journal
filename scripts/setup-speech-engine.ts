import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";

async function main() {
  const WS_URL = process.env.SPEECH_ENGINE_WS_URL;

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error("Missing ELEVENLABS_API_KEY in .env");
    process.exit(1);
  }

  if (!WS_URL) {
    console.error(
      "Missing SPEECH_ENGINE_WS_URL — set to your public WebSocket URL, e.g.:"
    );
    console.error("  Production: wss://YOUR-DOMAIN.up.railway.app/ws");
    console.error("  Local dev:  wss://YOUR-NGROK-URL/ws");
    console.error("\nSteps (local):");
    console.error("  1. Start ngrok: ngrok http 3002");
    console.error("  2. Set SPEECH_ENGINE_WS_URL=wss://YOUR-NGROK-URL/ws in .env");
    console.error("  3. Re-run this script");
    console.error("\nSteps (Railway): see docs/DEPLOY.md → npm run setup:production");
    process.exit(1);
  }

  const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  const { SPEECH_ENGINE_CONVERSATION_CONFIG } = await import("../src/lib/speech-engine-config");

  const engine = await elevenlabs.speechEngine.create({
    name: "Voice Journal",
    speechEngine: {
      wsUrl: WS_URL,
    },
    turn: SPEECH_ENGINE_CONVERSATION_CONFIG.turn,
    conversation: SPEECH_ENGINE_CONVERSATION_CONFIG.conversation,
    overrides: {
      firstMessage: true,
    },
  });

  console.log("\n✓ Speech Engine created!\n");
  console.log("Add this to your .env:\n");
  console.log(`SPEECH_ENGINE_ID=${engine.engineId}`);
  console.log("\nThen start the server: npm run speech-engine");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
