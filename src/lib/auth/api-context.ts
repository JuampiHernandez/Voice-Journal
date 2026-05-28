import { NextRequest, NextResponse } from "next/server";
import { resolveJournalUserId } from "@/lib/auth/resolve-user";
import { ensureUser } from "@/lib/memory";
import { isReadOnlyRuntime } from "@/lib/runtime";
import { ensureShowcaseSeeded } from "@/lib/showcase-seed";

export function withJournalUser(
  request: NextRequest,
  requestedUserId?: string | null
): { userId: string; mode: "local" } | NextResponse {
  const resolved = resolveJournalUserId(request, requestedUserId);
  if (resolved instanceof NextResponse) return resolved;
  ensureUser(resolved.userId);
  if (isReadOnlyRuntime()) {
    ensureShowcaseSeeded(resolved.userId);
  }
  return resolved;
}
