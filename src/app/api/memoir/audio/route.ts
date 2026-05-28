import { NextRequest, NextResponse } from "next/server";
import { getMemoir } from "@/lib/memory";
import { readAudioFile } from "@/lib/storage";
import { withJournalUser } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const ctx = withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
  const type = request.nextUrl.searchParams.get("type") ?? "narration";

  const memoir = getMemoir(userId, year);
  if (!memoir) {
    return NextResponse.json({ error: "Memoir not found" }, { status: 404 });
  }

  const storagePath = type === "music" ? memoir.music_path : memoir.narration_path;
  if (!storagePath) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  const buffer = readAudioFile(storagePath);
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
