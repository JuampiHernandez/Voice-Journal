import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

const NARRATOR_VOICE = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";

export function getElevenLabs(): ElevenLabsClient {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is required");
  }
  return new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
}

async function streamToBuffer(stream: ReadableStream<Uint8Array> | Readable): Promise<Buffer> {
  if (stream instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

export async function generateNarrationBuffer(text: string): Promise<Buffer> {
  const elevenlabs = getElevenLabs();
  const audio = await elevenlabs.textToSpeech.convert(NARRATOR_VOICE, {
    text,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
  });
  return streamToBuffer(audio);
}

/** Local dev fallback — writes to disk */
export async function generateNarration(text: string, outputPath: string): Promise<string> {
  const buffer = await generateNarrationBuffer(text);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

export async function generateMemoirMusicBuffer(mood = "reflective"): Promise<Buffer> {
  const elevenlabs = getElevenLabs();
  const prompt =
    mood === "reflective"
      ? "Gentle ambient piano and soft strings, warm and introspective, slow tempo, cinematic documentary score, no vocals, emotional but hopeful"
      : "Uplifting acoustic guitar with light percussion, warm sunrise feeling, inspirational documentary music, no vocals";

  const audio = await elevenlabs.music.compose({
    prompt,
    musicLengthMs: 120000,
    modelId: "music_v1",
    forceInstrumental: true,
  });
  return streamToBuffer(audio);
}

export async function generateMemoirMusic(outputPath: string, mood = "reflective"): Promise<string> {
  const buffer = await generateMemoirMusicBuffer(mood);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}
