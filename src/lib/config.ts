import { resolveSpeechEngineWsUrl } from "@/lib/speech-engine-sync";

export type AppConfig = {
  speechEngineReady: boolean;
  openaiReady: boolean;
  elevenlabsReady: boolean;
  missing: string[];
};

export function getAppConfig(): AppConfig {
  const elevenKey = process.env.ELEVENLABS_API_KEY ?? "";
  const openaiKey = process.env.OPENAI_API_KEY ?? "";
  const speechEngineId = process.env.SPEECH_ENGINE_ID ?? "";
  const wsUrl = resolveSpeechEngineWsUrl() ?? process.env.SPEECH_ENGINE_WS_URL ?? "";

  const elevenlabsReady =
    elevenKey.length > 0 && !elevenKey.includes("your_") && !elevenKey.startsWith("sk-your");
  const openaiReady =
    openaiKey.length > 0 && !openaiKey.includes("your_") && !openaiKey.startsWith("sk-your");
  const wsReady =
    wsUrl.startsWith("wss://") && !wsUrl.includes("YOUR-NGROK") && !wsUrl.includes("your-");
  const speechEngineReady =
    elevenlabsReady && openaiReady && speechEngineId.length > 0 && wsReady;

  const missing: string[] = [];
  if (!elevenlabsReady) missing.push("ELEVENLABS_API_KEY");
  if (!openaiReady) missing.push("OPENAI_API_KEY");
  if (!speechEngineId) missing.push("SPEECH_ENGINE_ID");
  if (!wsReady) missing.push("SPEECH_ENGINE_WS_URL");

  return { speechEngineReady, openaiReady, elevenlabsReady, missing };
}
