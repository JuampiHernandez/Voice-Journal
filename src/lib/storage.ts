import fs from "node:fs";
import path from "node:path";

const AUDIO_DIR = path.join(process.cwd(), "data", "audio");

function ensureAudioDir() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function resolveAudioPath(storagePath: string): string {
  return path.join(AUDIO_DIR, storagePath);
}

export function uploadAudio(storagePath: string, data: Buffer): string {
  ensureAudioDir();
  const fullPath = resolveAudioPath(storagePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, data);
  return storagePath;
}

export function readAudioFile(storagePath: string): Buffer | null {
  const fullPath = resolveAudioPath(storagePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
}

export function weeklyAudioPath(userId: string, weekStart: string) {
  return `weekly/${userId}/${weekStart}.mp3`;
}

export function memoirNarrationPath(userId: string, year: number) {
  return `memoirs/${userId}/${year}/narration.mp3`;
}

export function memoirMusicPath(userId: string, year: number) {
  return `memoirs/${userId}/${year}/music.mp3`;
}
