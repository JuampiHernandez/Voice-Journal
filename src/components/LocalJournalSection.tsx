"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserId } from "@/lib/user";

export function LocalJournalSection() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const short = userId && userId.length > 12 ? `${userId.slice(0, 8)}…` : userId;

  return (
    <section className="mt-6 rounded-2xl border border-stone-800 bg-stone-900/40 p-6">
      <h2 className="text-sm font-medium text-stone-200">Localhost (full voice)</h2>
      <p className="mt-2 text-sm text-stone-500">
        After <code className="text-amber-200/80">npm run dev:full</code>, open check-in. This
        browser gets its own journal id automatically — no signup or URL param needed.
      </p>
      <Link href="/journal" className="mt-3 inline-block text-sm text-amber-400 hover:underline">
        /journal
      </Link>
      {userId && (
        <p className="mt-3 text-xs text-stone-600">
          Your journal id: <code className="text-amber-200/80">{short}</code> (saved in this
          browser). Optional: add <code className="text-amber-200/80">?user=YourName</code> only if
          you want a readable name or a second journal on the same machine.
        </p>
      )}
    </section>
  );
}
