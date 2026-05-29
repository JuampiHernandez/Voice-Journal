"use client";

import { useEffect, useState } from "react";
import { isClientReadOnly } from "@/lib/runtime";
import { getShowcaseUser } from "@/lib/showcase-users";
import { getUserId } from "@/lib/user";

export function useJournalUser() {
  const [userId, setUserId] = useState("demo-user");
  const [ready, setReady] = useState(false);
  const readOnly = isClientReadOnly();

  useEffect(() => {
    queueMicrotask(() => {
      setUserId(getUserId());
      setReady(true);
    });
  }, []);

  return {
    userId,
    mode: "local" as const,
    ready,
    readOnly,
    label: readOnly ? (getShowcaseUser(userId)?.label ?? userId) : userId,
  };
}
