"use client";

import { isClientReadOnly } from "@/lib/runtime";
import {
  DEFAULT_SHOWCASE_USER_ID,
  isShowcaseUserId,
  type ShowcaseUser,
} from "@/lib/showcase-users";

const USER_KEY = "voice-journal-user-id";

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

export type { ShowcaseUser };
