"use client";

import { isClientReadOnly } from "@/lib/runtime";
import {
  DEFAULT_SHOWCASE_USER_ID,
  isShowcaseUserId,
  type ShowcaseUser,
} from "@/lib/showcase-users";

const USER_KEY = "voice-journal-user-id";

const PLACEHOLDER_USER_IDS = new Set(["alex", "yourname"]);

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isPlaceholderUserId(userId: string): boolean {
  return PLACEHOLDER_USER_IDS.has(userId.trim().toLowerCase());
}

export function getUserId(): string {
  if (typeof window === "undefined") return DEFAULT_SHOWCASE_USER_ID;

  const fromUrl = new URLSearchParams(window.location.search).get("user");
  if (fromUrl?.trim()) {
    const id = fromUrl.trim();
    if (!isClientReadOnly() || isShowcaseUserId(id)) {
      localStorage.setItem(USER_KEY, id);
      return id;
    }
  }

  if (isClientReadOnly()) {
    const saved = localStorage.getItem(USER_KEY);
    if (saved && isShowcaseUserId(saved)) return saved;
    return DEFAULT_SHOWCASE_USER_ID;
  }

  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_KEY, id);
  }
  return id;
}

export function setUserId(userId: string) {
  localStorage.setItem(USER_KEY, userId);
  const url = new URL(window.location.href);
  url.searchParams.set("user", userId);
  window.location.assign(url.toString());
}

/** On localhost, recover from stale placeholder ids like Alex → real journal with data. */
export async function recoverLocalJournalUser(currentId: string): Promise<string | null> {
  if (isClientReadOnly() || isUuid(currentId) || !isPlaceholderUserId(currentId)) {
    return null;
  }

  try {
    const entriesRes = await fetch(`/api/entries?userId=${encodeURIComponent(currentId)}`);
    const entries = await entriesRes.json();
    if (entriesRes.ok && Array.isArray(entries.entries) && entries.entries.length > 0) {
      return null;
    }

    const primaryRes = await fetch("/api/dev/primary-user");
    if (!primaryRes.ok) return null;

    const primary = (await primaryRes.json()) as { userId?: string | null; entries?: number };
    if (!primary.userId || primary.userId === currentId || !primary.entries) {
      return null;
    }

    localStorage.setItem(USER_KEY, primary.userId);
    return primary.userId;
  } catch {
    return null;
  }
}

export type { ShowcaseUser };
