import { NextRequest, NextResponse } from "next/server";
import { isReadOnlyRuntime } from "@/lib/runtime";
import { isShowcaseUserId, resolveShowcaseUserId } from "@/lib/showcase-users";

/** Local journal user id from query/body — no cloud auth required. */
export function resolveJournalUserId(
  request: NextRequest,
  requestedUserId?: string | null
): { userId: string; mode: "local" } | NextResponse {
  const fromQuery = request.nextUrl.searchParams.get("userId");
  let userId = (requestedUserId ?? fromQuery ?? process.env.DEFAULT_USER_ID ?? "demo-user").trim();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (isReadOnlyRuntime()) {
    if (!isShowcaseUserId(userId)) {
      return NextResponse.json(
        {
          error: "Unknown showcase journal. Use the Demo week journal on the deployed demo.",
          readOnly: true,
        },
        { status: 403 }
      );
    }
    userId = resolveShowcaseUserId(userId);
  }

  return { userId, mode: "local" };
}
