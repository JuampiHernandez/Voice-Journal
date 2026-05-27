import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";

const id = process.env.SPEECH_ENGINE_ID;
const wsUrl = process.env.SPEECH_ENGINE_WS_URL;

if (!id || !wsUrl) {
  console.error("Need SPEECH_ENGINE_ID and SPEECH_ENGINE_WS_URL in .env");
  process.exit(1);
}

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });
await elevenlabs.speechEngine.update(id, { speechEngine: { wsUrl } });
console.log("Updated Speech Engine wsUrl:", wsUrl);
