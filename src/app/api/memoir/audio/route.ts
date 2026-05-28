import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAudioSignedUrl } from "@/lib/storage";
import { withJournalUser } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const ctx = await withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
  const type = request.nextUrl.searchParams.get("type") ?? "narration";

  const { data: memoir } = await createAdminClient()
    .from("memoirs")
    .select("narration_path, music_path")
    .eq("user_id", userId)
    .eq("year", year)
    .maybeSingle();

  if (!memoir) {
    return NextResponse.json({ error: "Memoir not found" }, { status: 404 });
  }

  const storagePath = type === "music" ? memoir.music_path : memoir.narration_path;
  const signedUrl = await getAudioSignedUrl(storagePath as string);
  if (!signedUrl) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  return NextResponse.redirect(signedUrl);
}
