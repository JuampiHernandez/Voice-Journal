import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
  const type = request.nextUrl.searchParams.get("type") ?? "narration";

  const db = getDb();
  const memoir = db
    .prepare("SELECT narration_path, music_path FROM memoirs WHERE user_id = ? AND year = ?")
    .get(userId, year) as { narration_path: string; music_path: string } | undefined;

  if (!memoir) {
    return NextResponse.json({ error: "Memoir not found" }, { status: 404 });
  }

  const filePath = type === "music" ? memoir.music_path : memoir.narration_path;

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
