import { createAdminClient } from "@/lib/supabase/admin";

export const AUDIO_BUCKET = "journal-audio";

export async function uploadAudio(storagePath: string, data: Buffer): Promise<string> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(storagePath, data, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

export async function getAudioSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!storagePath) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
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
