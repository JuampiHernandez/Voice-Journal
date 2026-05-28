import { NextRequest, NextResponse } from "next/server";
import { resolveJournalUserId } from "@/lib/auth/resolve-user";
import { ensureUser } from "@/lib/memory";

export async function withJournalUser(
  request: NextRequest,
  requestedUserId?: string | null
): Promise<{ userId: string; mode: "auth" | "guest" } | NextResponse> {
  const resolved = await resolveJournalUserId(request, requestedUserId);
  if (resolved instanceof NextResponse) return resolved;
  await ensureUser(resolved.userId);
  return resolved;
}
