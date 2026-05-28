import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isEntryAnalysisReady } from "@/lib/memory";
import { withJournalUser } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const ctx = withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const conversationId = request.nextUrl.searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ saved: false });
  }

  const row = getDb()
    .prepare(
      "SELECT id, entry_date, summary FROM journal_entries WHERE user_id = ? AND conversation_id = ?"
    )
    .get(userId, conversationId) as
    | { id: string; entry_date: string; summary: string | null }
    | undefined;

  if (!row) {
    return NextResponse.json({ saved: false, conversationId, reason: "no_entry" });
  }

  const ready = isEntryAnalysisReady(row.summary);

  return NextResponse.json({
    saved: ready,
    processing: !ready,
    entryId: row.id,
    entryDate: row.entry_date,
    summary: row.summary,
    conversationId,
  });
}
