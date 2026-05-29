"use client";

import { useEffect, useState } from "react";
import { isClientReadOnly } from "@/lib/runtime";
import { SHOWCASE_USERS } from "@/lib/showcase-users";
import { getUserId } from "@/lib/user";

type ShowcaseUserPickerProps = {
  compact?: boolean;
  className?: string;
};

export function ShowcaseUserPicker({ compact = false, className = "" }: ShowcaseUserPickerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setActiveId(getUserId()));
  }, []);

  if (!isClientReadOnly() || !activeId) return null;

  return (
    <div className={className}>
      {!compact && (
        <p className="mb-3 text-sm text-stone-400">
          Browse the sample journal below — read-only on the deployed demo. To voice journal, clone
          and run locally.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {SHOWCASE_USERS.map((user) => {
          const active = user.id === activeId;
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                if (user.id === activeId) return;
                const url = new URL(window.location.href);
                url.searchParams.set("user", user.id);
                window.location.assign(url.toString());
              }}
              className={`rounded-full border px-4 py-2 text-left transition-colors ${
                active
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-100"
                  : "border-stone-700 bg-stone-900/60 text-stone-400 hover:border-stone-600 hover:text-stone-200"
              }`}
            >
              <span className="block text-sm font-medium">{user.label}</span>
              {!compact && (
                <span className="mt-0.5 block text-xs opacity-80">{user.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReadOnlyBanner({ className = "" }: { className?: string }) {
  if (!isClientReadOnly()) return null;

  return (
    <div
      className={`rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-stone-400 ${className}`}
    >
      <strong className="font-medium text-amber-200/90">Demo mode — view only.</strong> Live voice
      check-ins run on localhost. Fork the repo and run{" "}
      <code className="text-amber-200/80">npm run dev:full</code>.
    </div>
  );
}

export function LocalUserBanner({ userId }: { userId: string }) {
  if (isClientReadOnly()) return null;

  const short = userId.length > 20 ? `${userId.slice(0, 8)}…${userId.slice(-4)}` : userId;

  return (
    <p className="rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-3 text-xs text-stone-500">
      Your journal: <code className="text-amber-200/80">{short}</code>
      {userId.length > 20 && (
        <span className="ml-1 text-stone-600" title={userId}>
          (full id in URL)
        </span>
      )}
      {" — "}
      entries are stored under this id. Optional: use{" "}
      <code className="text-amber-200/80">?user=YourName</code> for a readable name or a second
      journal on this machine.
    </p>
  );
}
