"use client";

import { useEffect } from "react";
import { getUserId, recoverLocalJournalUser } from "@/lib/user";

export function LocalJournalRecovery() {
  useEffect(() => {
    async function recover() {
      const currentId = getUserId();
      const recoveredId = await recoverLocalJournalUser(currentId);
      if (!recoveredId) return;

      const url = new URL(window.location.href);
      url.searchParams.set("user", recoveredId);
      window.location.replace(url.toString());
    }

    void recover();
  }, []);

  return null;
}
