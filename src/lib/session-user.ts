import { createAdminClient } from "@/lib/supabase/admin";

export async function registerPendingSessionUser(userId: string) {
  const supabase = createAdminClient();
  await supabase.from("pending_session_users").insert({ user_id: userId });
  await supabase
    .from("pending_session_users")
    .delete()
    .lt("created_at", new Date(Date.now() - 2 * 60 * 1000).toISOString());
}

export async function consumePendingSessionUser(): Promise<string> {
  const supabase = createAdminClient();
  const { data: pending } = await supabase
    .from("pending_session_users")
    .select("user_id, created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pending?.user_id) {
    await supabase
      .from("pending_session_users")
      .delete()
      .eq("user_id", pending.user_id)
      .eq("created_at", pending.created_at);
    return pending.user_id;
  }

  return process.env.DEFAULT_USER_ID ?? "demo-user";
}
