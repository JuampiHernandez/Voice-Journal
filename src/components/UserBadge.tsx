"use client";

import { useEffect, useState } from "react";
import { isClientReadOnly } from "@/lib/runtime";
import { getShowcaseUser } from "@/lib/showcase-users";
import { getUserId } from "@/lib/user";
import { ShowcaseUserPicker } from "./ShowcaseUserPicker";

export function UserBadge({ compact = false }: { compact?: boolean }) {
  const [userId, setUserId] = useState<string | null>(null);
  const readOnly = isClientReadOnly();

  useEffect(() => {
    queueMicrotask(() => setUserId(getUserId()));
  }, []);

  if (!userId) return null;

  const showcase = readOnly ? getShowcaseUser(userId) : null;
  const label = showcase?.label ?? (userId.length > 12 ? `${userId.slice(0, 8)}…` : userId);

  if (readOnly && !compact) {
    return <ShowcaseUserPicker />;
  }

  if (compact) {
    return (
      <span
        className="rounded-full border border-stone-800 px-3 py-1 text-xs text-stone-500"
        title={
          readOnly
            ? `Viewing ${showcase?.label ?? userId} (demo)`
            : `Journal user: ${userId}. Optional ?user=YourName to switch.`
        }
      >
        {readOnly ? `Viewing: ${label}` : label}
      </span>
    );
  }

  return (
    <p className="text-sm text-stone-500">
      Journal user: <code className="text-amber-200/80">{userId}</code> — optional{" "}
      <code className="text-amber-200/80">?user=YourName</code> in the URL to switch.
    </p>
  );
}
