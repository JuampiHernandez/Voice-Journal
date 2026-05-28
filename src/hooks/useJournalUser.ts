"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const GUEST_KEY = "voice-journal-user-id";

export function authConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.length > 0 && !url.includes("your-project");
}

function getGuestUserId(): string {
  if (typeof window === "undefined") return "demo-user";

  const fromUrl = new URLSearchParams(window.location.search).get("user");
  if (fromUrl?.trim()) {
    localStorage.setItem(GUEST_KEY, fromUrl.trim());
    return fromUrl.trim();
  }

  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export function useJournalUser() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [guestId, setGuestId] = useState("demo-user");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGuestId(getGuestUserId());
    if (!authConfigured()) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const userId = authUser?.id ?? guestId;
  const mode = authUser ? ("auth" as const) : ("guest" as const);

  return { userId, mode, authUser, guestId, ready };
}

/** @deprecated Use useJournalUser — kept for gradual migration */
export function getUserId(): string {
  return getGuestUserId();
}
