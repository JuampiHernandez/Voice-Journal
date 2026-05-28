import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withJournalUser } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const ctx = await withJournalUser(
    request,
    request.nextUrl.searchParams.get("userId")
  );
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const conversationId = request.nextUrl.searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ saved: false });
  }

  const { data: entry } = await createAdminClient()
    .from("journal_entries")
    .select("id, entry_date, summary")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

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
