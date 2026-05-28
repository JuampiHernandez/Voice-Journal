import { getDb } from "./db";

export function registerPendingSessionUser(userId: string) {
  const db = getDb();
  db.prepare("INSERT INTO pending_session_users (user_id) VALUES (?)").run(userId);
  db.prepare(
    "DELETE FROM pending_session_users WHERE created_at < datetime('now', '-2 minutes')"
  ).run();
}

export function consumePendingSessionUser(): string {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT user_id FROM pending_session_users ORDER BY created_at DESC LIMIT 1"
    )
    .get() as { user_id: string } | undefined;
  return row?.user_id ?? process.env.DEFAULT_USER_ID ?? "demo-user";
}
