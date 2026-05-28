import { NextRequest, NextResponse } from "next/server";
import { getWeeklySummary, getCurrentWeekRange } from "@/lib/memory";
import { getAudioSignedUrl } from "@/lib/storage";
import { withJournalUser } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const ctx = await withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const weekStart =
    request.nextUrl.searchParams.get("weekStart") ?? getCurrentWeekRange().start;

  const summary = await getWeeklySummary(userId, weekStart);
  if (!summary?.audio_path) {
    return NextResponse.json({ error: "Weekly voice recap not found" }, { status: 404 });
  }

  const signedUrl = await getAudioSignedUrl(summary.audio_path);
  if (!signedUrl) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  return NextResponse.redirect(signedUrl);
}
