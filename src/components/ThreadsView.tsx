"use client";

import { useCallback, useEffect, useState } from "react";
import { useJournalUser } from "@/hooks/useJournalUser";
import { ReadOnlyBanner, ShowcaseUserPicker } from "./ShowcaseUserPicker";
import { ThreadMap, formatThreadDateRange } from "./ThreadMap";

type Thread = {
  id: string;
  title: string;
  summary: string;
  intensity: number;
  trend: "rising" | "stable" | "fading";
  mentionCount: number;
  firstSeen: string;
  lastSeen: string;
  focusPriority: number;
  suggestedActions: string[];
  relatedDates: string[];
};

type ThreadVariant = "worry" | "bright";

const WORRY_TREND_BADGE = {
  rising: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  stable: "border-stone-500/30 bg-stone-500/10 text-stone-400",
  fading: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const BRIGHT_TREND_BADGE = {
  rising: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  stable: "border-stone-500/30 bg-stone-500/10 text-stone-400",
  fading: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const WORRY_LOAD_BAR = {
  rising: "bg-gradient-to-r from-rose-600 to-amber-500",
  stable: "bg-gradient-to-r from-stone-600 to-stone-400",
  fading: "bg-gradient-to-r from-emerald-700 to-emerald-400",
};

const BRIGHT_LOAD_BAR = {
  rising: "bg-gradient-to-r from-emerald-600 to-teal-400",
  stable: "bg-gradient-to-r from-stone-600 to-stone-400",
  fading: "bg-gradient-to-r from-amber-600 to-amber-400",
};

export function ThreadsView() {
  const { userId, ready, readOnly } = useJournalUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [brightThreads, setBrightThreads] = useState<Thread[]>([]);
  const [focusRecommendation, setFocusRecommendation] = useState<string | null>(null);
  const [celebrateRecommendation, setCelebrateRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/threads?userId=${encodeURIComponent(userId)}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not load threads");
        setThreads([]);
        setBrightThreads([]);
        return;
      }
      setThreads(data.threads ?? []);
      setBrightThreads(data.brightThreads ?? []);
      setFocusRecommendation(data.focusRecommendation ?? null);
      setCelebrateRecommendation(data.celebrateRecommendation ?? null);
    } catch {
      setError("Could not load threads");
      setThreads([]);
      setBrightThreads([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (ready) queueMicrotask(() => void load());
  }, [ready, load]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThreads(data.threads);
      setBrightThreads(data.brightThreads ?? []);
      setFocusRecommendation(data.focusRecommendation);
      setCelebrateRecommendation(data.celebrateRecommendation ?? null);
      setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to map threads");
    } finally {
      setGenerating(false);
    }
  }

  function toggleThread(id: string, scrollToRow = false) {
    setExpandedId((prev) => (prev === id ? null : id));
    if (scrollToRow) {
      requestAnimationFrame(() => {
        document.getElementById(`thread-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  if (loading) {
    return <p className="py-20 text-center text-stone-500">Mapping what&apos;s on your mind…</p>;
  }

  const sortedWorries = [...threads].sort((a, b) => a.focusPriority - b.focusPriority);
  const sortedBright = [...brightThreads].sort((a, b) => a.focusPriority - b.focusPriority);
  const hasAnyThreads = sortedWorries.length > 0 || sortedBright.length > 0;

  return (
    <div className="space-y-8">
      {readOnly && <ShowcaseUserPicker />}
      <ReadOnlyBanner />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="font-serif text-2xl font-light tracking-tight text-stone-100 sm:text-3xl">
            What&apos;s on your mind
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Worry threads and bright threads from your journal — what weighs on you and what lifts you.
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => void generate()}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-5 py-2.5 text-sm text-stone-300 transition-colors hover:border-stone-500 hover:text-stone-100 disabled:opacity-50"
          >
            <RefreshIcon spinning={generating} />
            {generating ? "Analyzing…" : hasAnyThreads ? "Refresh map" : "Map my threads"}
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </p>
      )}

      {!hasAnyThreads ? (
        <div className="rounded-2xl border border-dashed border-stone-800 py-16 text-center">
          <p className="text-sm text-stone-500">
            No threads yet. Add journal entries, then tap &ldquo;Map my threads&rdquo;.
          </p>
        </div>
      ) : (
        <>
          <ThreadSection
            title="Taking space"
            subtitle="Recurring worries and preoccupations"
            recommendation={focusRecommendation}
            recommendationLabel="Focus this week"
            recommendationAccent="amber"
            threads={sortedWorries}
            variant="worry"
            intensityColumn="Mental load"
            nextStepColumn="Next step"
            emptyMessage="No worry threads detected this period."
            expandedId={expandedId}
            onToggle={toggleThread}
          />

          <ThreadSection
            title="Giving energy"
            subtitle="Wins, gratitude, and things that lift you"
            recommendation={celebrateRecommendation}
            recommendationLabel="Celebrate this week"
            recommendationAccent="emerald"
            threads={sortedBright}
            variant="bright"
            intensityColumn="Energy"
            nextStepColumn="Savor"
            emptyMessage="No bright threads yet — they appear when you mention wins, gratitude, or things that energize you."
            expandedId={expandedId}
            onToggle={toggleThread}
          />
        </>
      )}

      <p className="flex items-center justify-center gap-2 pt-2 text-center text-xs text-stone-600">
        <LockIcon />
        Private to you. Your voice stays yours.
      </p>
    </div>
  );
}

function ThreadSection({
  title,
  subtitle,
  recommendation,
  recommendationLabel,
  recommendationAccent,
  threads,
  variant,
  intensityColumn,
  nextStepColumn,
  emptyMessage,
  expandedId,
  onToggle,
}: {
  title: string;
  subtitle: string;
  recommendation: string | null;
  recommendationLabel: string;
  recommendationAccent: "amber" | "emerald";
  threads: Thread[];
  variant: ThreadVariant;
  intensityColumn: string;
  nextStepColumn: string;
  emptyMessage: string;
  expandedId: string | null;
  onToggle: (id: string, scrollToRow?: boolean) => void;
}) {
  const accentStyles =
    recommendationAccent === "emerald"
      ? {
          border: "border-emerald-500/25 bg-emerald-500/[0.06]",
          icon: "text-emerald-400",
          label: "text-emerald-500",
        }
      : {
          border: "border-amber-500/25 bg-amber-500/[0.06]",
          icon: "text-amber-400",
          label: "text-amber-500",
        };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-stone-200">{title}</h2>
        <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>
      </div>

      {recommendation && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 sm:px-5 ${accentStyles.border}`}>
          <span className={`mt-0.5 ${accentStyles.icon}`} aria-hidden>
            ✦
          </span>
          <div>
            <p className={`text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${accentStyles.label}`}>
              {recommendationLabel}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-300">{recommendation}</p>
          </div>
        </div>
      )}

      {threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-800 px-4 py-10 text-center">
          <p className="text-sm text-stone-500">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <ThreadMap
            threads={threads}
            activeId={expandedId}
            onSelect={(id) => onToggle(id, true)}
            variant={variant}
            intensityLabel={intensityColumn}
          />

          <div className="overflow-x-auto rounded-2xl border border-stone-800/80">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-800 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-stone-500">
                  <th className="w-10 px-3 py-2.5 font-medium" />
                  <th className="px-3 py-2.5 font-medium">Priority</th>
                  <th className="px-3 py-2.5 font-medium">Thread</th>
                  <th className="px-3 py-2.5 font-medium">Trend</th>
                  <th className="px-3 py-2.5 font-medium">{intensityColumn}</th>
                  <th className="px-3 py-2.5 font-medium">Mentions</th>
                  <th className="px-3 py-2.5 font-medium">{nextStepColumn}</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread, index) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    rank={index + 1}
                    variant={variant}
                    expanded={expandedId === thread.id}
                    onToggle={() => onToggle(thread.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function ThreadRow({
  thread,
  rank,
  variant,
  expanded,
  onToggle,
}: {
  thread: Thread;
  rank: number;
  variant: ThreadVariant;
  expanded: boolean;
  onToggle: () => void;
}) {
  const trendBadge = variant === "bright" ? BRIGHT_TREND_BADGE : WORRY_TREND_BADGE;
  const loadBar = variant === "bright" ? BRIGHT_LOAD_BAR : WORRY_LOAD_BAR;
  const intensityPct = Math.round((thread.intensity / 10) * 100);
  const nextStep = thread.suggestedActions[0];
  const priorityAccent = rank <= 2;
  const priorityStyles =
    variant === "bright"
      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
      : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30";

  return (
    <>
      <tr
        id={`thread-row-${thread.id}`}
        onClick={onToggle}
        className={`cursor-pointer border-b border-stone-800/60 transition-colors ${
          expanded ? "bg-stone-900/40" : "hover:bg-stone-900/25"
        }`}
        aria-expanded={expanded}
      >
        <td className="px-2 py-3 text-stone-600">
          <ChevronIcon expanded={expanded} />
        </td>
        <td className="px-3 py-3">
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
              priorityAccent ? priorityStyles : "bg-stone-800 text-stone-400"
            }`}
          >
            {rank}
          </span>
        </td>
        <td className="px-3 py-3 font-medium text-stone-200">{thread.title}</td>
        <td className="px-3 py-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs capitalize ${trendBadge[thread.trend]}`}
          >
            {thread.trend}
          </span>
        </td>
        <td className="px-3 py-3">
          <div className="flex min-w-[120px] items-center gap-3">
            <span className="w-8 shrink-0 tabular-nums text-stone-400">
              {thread.intensity.toFixed(1)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-800">
              <div
                className={`h-full rounded-full ${loadBar[thread.trend]}`}
                style={{ width: `${intensityPct}%` }}
              />
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-stone-500">
          <span className="text-stone-400">{thread.mentionCount} mentions</span>
          <span className="mx-1.5 text-stone-700">·</span>
          <span>{formatThreadDateRange(thread.firstSeen, thread.lastSeen)}</span>
        </td>
        <td className="px-3 py-3">
          {nextStep ? (
            <span className="inline-flex max-w-[200px] items-center gap-1 truncate text-stone-400">
              {nextStep}
            </span>
          ) : (
            <span className="text-stone-600">—</span>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-stone-800/60 bg-stone-950/50">
          <td colSpan={7} className="px-6 py-5">
            <ThreadDetail thread={thread} variant={variant} />
          </td>
        </tr>
      )}
    </>
  );
}

function ThreadDetail({ thread, variant }: { thread: Thread; variant: ThreadVariant }) {
  const actionsLabel = variant === "bright" ? "Ways to savor" : "Try this";
  const accent = variant === "bright" ? "text-emerald-500" : "text-amber-500";

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-stone-500">
          What&apos;s going on
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-300">{thread.summary}</p>
      </div>

      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-stone-500">
          {actionsLabel}
        </p>
        {thread.suggestedActions.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {thread.suggestedActions.map((action, i) => (
              <li key={i} className="flex gap-2 text-sm text-stone-300">
                <span className={`shrink-0 ${accent}`}>→</span>
                {action}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-600">No suggestions yet.</p>
        )}
      </div>

      {thread.relatedDates.length > 0 && (
        <div className="sm:col-span-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-stone-500">
            Showed up on
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {thread.relatedDates.map((date) => (
              <span
                key={date}
                className="rounded-full border border-stone-800 bg-stone-900/60 px-2.5 py-0.5 text-xs text-stone-500"
              >
                {date}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={spinning ? "animate-spin" : ""}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform ${expanded ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
