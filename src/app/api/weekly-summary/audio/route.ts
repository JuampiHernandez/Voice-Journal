import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { getWeeklySummary, getCurrentWeekRange } from "@/lib/memory";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
  const weekStart =
    request.nextUrl.searchParams.get("weekStart") ?? getCurrentWeekRange().start;

  const summary = getWeeklySummary(userId, weekStart);
  if (!summary?.audio_path || !fs.existsSync(summary.audio_path)) {
    return NextResponse.json({ error: "Weekly voice recap not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(summary.audio_path);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
