"use client";

const USER_KEY = "voice-journal-user-id";

export function getUserId(): string {
  if (typeof window === "undefined") return "demo-user";

  const fromUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("user")
      : null;
  if (fromUrl?.trim()) {
    localStorage.setItem(USER_KEY, fromUrl.trim());
    return fromUrl.trim();
  }

  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_KEY, id);
  }
  return id;
}
