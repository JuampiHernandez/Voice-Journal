import "dotenv/config";
import { syncSpeechEngineWsUrl } from "../src/lib/speech-engine-sync";

async function main() {
  const result = await syncSpeechEngineWsUrl();

  if (!result.ok) {
    console.error("✗", result.error);
    process.exit(1);
  }

  if (result.updated) {
    console.log(`✓ Updated ElevenLabs Speech Engine wsUrl`);
    console.log(`  was: ${result.registered}`);
    console.log(`  now: ${result.expected}`);
  } else {
    console.log(`✓ Speech Engine wsUrl already correct: ${result.expected}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
