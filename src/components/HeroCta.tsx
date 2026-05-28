"use client";

import Link from "next/link";
import { isClientReadOnly } from "@/lib/runtime";
import { DEFAULT_SHOWCASE_USER_ID } from "@/lib/showcase-users";

export function HeroCta() {
  const production = isClientReadOnly();

  if (production) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/dashboard?user=${DEFAULT_SHOWCASE_USER_ID}`}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-medium text-stone-950 shadow-lg shadow-amber-500/25 transition-colors hover:bg-amber-400"
        >
          Browse demo journal
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-7 py-3.5 text-sm text-stone-300 transition-colors hover:border-stone-600 hover:bg-stone-900/60"
        >
          Live voice setup
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="/journal"
        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-medium text-stone-950 shadow-lg shadow-amber-500/25 transition-colors hover:bg-amber-400"
      >
        Start today&apos;s check-in
        <span aria-hidden>→</span>
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-7 py-3.5 text-sm text-stone-300 transition-colors hover:border-stone-600 hover:bg-stone-900/60"
      >
        See insights
        <ChartIcon />
      </Link>
    </div>
  );
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19V5M4 19h16M8 17V11M12 17V7M16 17v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
