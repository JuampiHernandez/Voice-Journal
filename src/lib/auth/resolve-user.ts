import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export function guestJournalAllowed(): boolean {
  return process.env.ALLOW_GUEST_JOURNAL === "true";
}

/** Resolve journal user id: signed-in user wins; else guest id when allowed. */
export async function resolveJournalUserId(
  request: NextRequest,
  requestedUserId?: string | null
): Promise<{ userId: string; mode: "auth" | "guest" } | NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return { userId: user.id, mode: "auth" };
    }
  } catch {
    // Supabase not configured — fall through to guest if allowed
  }

  const fromQuery = request.nextUrl.searchParams.get("userId");
  const guestId = (requestedUserId ?? fromQuery ?? process.env.DEFAULT_USER_ID ?? "demo-user").trim();

  if (!guestJournalAllowed()) {
    return NextResponse.json(
      {
        error: "Sign in required",
        hint: "Use magic link on the nav bar, or set ALLOW_GUEST_JOURNAL=true for judge demos with ?user=YourName",
      },
      { status: 401 }
    );
  }

  if (!guestId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  return { userId: guestId, mode: "guest" };
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
