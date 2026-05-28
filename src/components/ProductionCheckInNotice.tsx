"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isClientReadOnly } from "@/lib/runtime";
import { DEFAULT_SHOWCASE_USER_ID } from "@/lib/showcase-users";

const DISMISS_KEY = "voice-journal-production-checkin-notice";

export function ProductionCheckInNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isClientReadOnly()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    setOpen(true);
  }, []);

  if (!open) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-labelledby="production-checkin-title"
        className="w-full max-w-md rounded-2xl border border-amber-500/25 bg-stone-900 p-6 shadow-2xl"
      >
        <h2 id="production-checkin-title" className="text-lg font-medium text-stone-100">
          Voice check-ins run locally
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">
          This deployed site is view-only for judges. Live 3-minute voice sessions need the Speech
          Engine on your machine with ngrok.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-stone-400">
          <li>
            <strong className="text-stone-300">Browse the demo:</strong>{" "}
            <Link
              href={`/dashboard?user=${DEFAULT_SHOWCASE_USER_ID}`}
              className="text-amber-400 hover:underline"
            >
              Insights → Demo week
            </Link>
          </li>
          <li>
            <strong className="text-stone-300">Try voice yourself:</strong> fork the repo, run{" "}
            <code className="text-amber-200/80">npm run dev:full</code>, open localhost.
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full bg-amber-500 px-5 py-2 text-sm font-medium text-stone-950 hover:bg-amber-400"
          >
            Got it
          </button>
          <Link
            href={`/dashboard?user=${DEFAULT_SHOWCASE_USER_ID}`}
            className="rounded-full border border-stone-700 px-5 py-2 text-sm text-stone-300 hover:border-stone-600"
          >
            See demo insights
          </Link>
        </div>
      </div>
    </div>
  );
}
