import { NextRequest, NextResponse } from "next/server";
import { getWeeklySummary, getCurrentWeekRange } from "@/lib/memory";
import { readAudioFile } from "@/lib/storage";
import { withJournalUser } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const ctx = withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const weekStart =
    request.nextUrl.searchParams.get("weekStart") ?? getCurrentWeekRange().start;

  const summary = getWeeklySummary(userId, weekStart);
  if (!summary?.audio_path) {
    return NextResponse.json({ error: "Weekly voice recap not found" }, { status: 404 });
  }

  const buffer = readAudioFile(summary.audio_path);
  if (!buffer) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
