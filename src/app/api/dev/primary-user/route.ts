import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isReadOnlyRuntime } from "@/lib/runtime";

export async function GET() {
  if (isReadOnlyRuntime()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const row = getDb()
    .prepare(
      `SELECT user_id AS userId, COUNT(*) AS entries
       FROM journal_entries
       GROUP BY user_id
       ORDER BY entries DESC
       LIMIT 1`
    )
    .get() as { userId: string; entries: number } | undefined;

  if (!row?.userId) {
    return NextResponse.json({ userId: null, entries: 0 });
  }

  return NextResponse.json(row);
}
