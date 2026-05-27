import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureUser } from "@/lib/memory";

/** Poll whether Speech Engine already persisted this session */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
  const conversationId = request.nextUrl.searchParams.get("conversationId");

  ensureUser(userId);

  if (!conversationId) {
    return NextResponse.json({ saved: false });
  }

  const db = getDb();
  const entry = db
    .prepare(
      `SELECT id, entry_date, summary FROM journal_entries
       WHERE user_id = ? AND conversation_id = ?`
    )
    .get(userId, conversationId) as
    | { id: string; entry_date: string; summary: string | null }
    | undefined;

  if (!entry) {
    return NextResponse.json({ saved: false, conversationId, reason: "no_entry" });
  }

  return NextResponse.json({
    saved: true,
    entryId: entry.id,
    entryDate: entry.entry_date,
    summary: entry.summary,
    conversationId,
  });
}
