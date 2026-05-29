"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useJournalUser } from "@/hooks/useJournalUser";
import { ReadOnlyBanner, ShowcaseUserPicker, LocalUserBanner } from "./ShowcaseUserPicker";
import {
  EmotionalTimelineChart,
  formatEntryDate,
  formatAudioTime,
  themeStyle,
} from "./EmotionalTimelineChart";

type Entry = {
  id: string;
  date: string;
  summary: string | null;
  mood: number | null;
  themes: string[];
};

type DashboardData = {
  streak: number;
  todayCompleted: boolean;
  entries: Entry[];
  emotionalMoments: { date: string; description: string; emotion: string; intensity: number }[];
};

export function DashboardView() {
  const { userId, ready, readOnly } = useJournalUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [weekly, setWeekly] = useState<{
    summary: string;
    insights: string[];
    supportNote?: string | null;
    audioUrl?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [generatingRecap, setGeneratingRecap] = useState(false);
  const [recapError, setRecapError] = useState<string | null>(null);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(() => new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingRecap, setPlayingRecap] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const loadDashboard = useCallback(async () => {
    setLoadError(null);
    const [entriesRes, weeklyRes] = await Promise.all([
      fetch(`/api/entries?userId=${encodeURIComponent(userId)}`, { credentials: "include" }),
      fetch(`/api/weekly-summary?userId=${encodeURIComponent(userId)}`, {
        credentials: "include",
      }),
    ]);
    const entries = await entriesRes.json();
    const weeklyData = await weeklyRes.json();

    if (!entriesRes.ok) {
      setLoadError(entries.error ?? "Could not load your journal");
      setData({ streak: 0, todayCompleted: false, entries: [], emotionalMoments: [] });
    } else {
      setData(entries);
    }

    if (weeklyRes.ok) {
      setWeekly(weeklyData);
    } else {
      setWeekly(null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (ready) queueMicrotask(() => void loadDashboard());
  }, [ready, loadDashboard]);

  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      if (document.visibilityState === "visible") void loadDashboard();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [ready, loadDashboard]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setAudioProgress(audio.currentTime);
    const onLoaded = () => setAudioDuration(audio.duration || 0);
    const onEnded = () => {
      setPlayingRecap(false);
      setAudioProgress(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [weekly?.audioUrl]);

  async function seedDemo() {
    setSeeding(true);
    await fetch("/api/demo/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });
    window.location.reload();
  }

  async function generateWeeklyRecap(demo: boolean) {
    setGeneratingRecap(true);
    setRecapError(null);
    try {
      const res = await fetch("/api/weekly-summary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, demo }),
      });
      const recap = await res.json();
      if (!res.ok) throw new Error(recap.error);
      setWeekly({
        summary: recap.summary,
        insights: recap.insights,
        supportNote: recap.supportNote,
        audioUrl: recap.audioUrl,
      });
    } catch (err) {
      setRecapError(err instanceof Error ? err.message : "Recap failed");
    } finally {
      setGeneratingRecap(false);
    }
  }

  function toggleRecapAudio() {
    if (!audioRef.current || !weekly?.audioUrl) return;
    if (playingRecap) {
      audioRef.current.pause();
      setPlayingRecap(false);
    } else {
      const url = new URL(weekly.audioUrl, window.location.origin);
      if (!url.searchParams.has("userId")) {
        url.searchParams.set("userId", userId);
      }
      audioRef.current.src = url.pathname + url.search;
      void audioRef.current.play().catch(() => {
        setPlayingRecap(false);
        setRecapError("Could not play voice recap. Try generating it again.");
      });
      setPlayingRecap(true);
    }
  }

  if (loading) {
    return <p className="py-20 text-center text-stone-500">Loading your memory…</p>;
  }

  const entries = data?.entries ?? [];
  const hasEntries = entries.length > 0;
  const visibleEntries = showAllEntries ? entries : entries.slice(0, 4);
  const topInsight = weekly?.insights?.[0] ?? weekly?.supportNote;
  const hasRecap = weekly?.summary && !weekly.summary.startsWith("No entries");
  const progressPct = audioDuration ? (audioProgress / audioDuration) * 100 : 0;

  return (
    <div className="space-y-6">
      {loadError && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {loadError}
          {!readOnly && (
            <>
              . Try adding <code className="text-amber-200/80">?user=YourName</code> to the URL.
            </>
          )}
        </p>
      )}
      {readOnly ? (
        <ShowcaseUserPicker />
      ) : (
        <LocalUserBanner userId={userId} />
      )}
      <ReadOnlyBanner />
      {/* Header + stats */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight text-stone-100 sm:text-4xl">
            Your insights
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Patterns, moods, and moments — all from your voice.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            icon="🔥"
            label="Day streak"
            value={String(data?.streak ?? 0)}
            sub="Days in a row"
            accent="amber"
          />
          <StatCard
            label="Total entries"
            value={String(entries.length)}
            sub="All time"
            accent="stone"
          />
          <StatCard
            label="Today"
            value={data?.todayCompleted ? "Done ✓" : "Pending"}
            sub="3:00 check-in"
            accent={data?.todayCompleted ? "emerald" : "rose"}
          />
        </div>
      </div>

      {/* Weekly voice recap */}
      <section className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_240px] lg:gap-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/25">
                <WaveIcon />
              </span>
              <h2 className="text-lg font-medium text-stone-100">Weekly voice recap</h2>
            </div>

            {recapError && <p className="mb-3 text-sm text-rose-400">{recapError}</p>}

            {hasRecap ? (
              <>
                <p className="text-sm leading-relaxed text-stone-300 whitespace-pre-line">
                  {weekly!.summary}
                </p>
                {topInsight && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
                    <span className="text-amber-400" aria-hidden>
                      ✦
                    </span>
                    <p className="text-sm text-amber-200/90">
                      <span className="font-medium text-amber-400/90">Insight: </span>
                      {topInsight}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-stone-500">
                {hasEntries
                  ? "Generate your weekly reflection — text summary + voice recap."
                  : "Complete check-ins or load demo week first."}
              </p>
            )}

            {!hasEntries && !readOnly && (
              <button
                onClick={seedDemo}
                disabled={seeding}
                className="mt-4 text-xs text-amber-400/80 hover:text-amber-300"
              >
                {seeding ? "Seeding…" : "Load demo week"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:items-stretch">
            {weekly?.audioUrl && (
              <button
                onClick={toggleRecapAudio}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-300 transition-colors hover:border-stone-500 hover:text-stone-100"
              >
                <PlayIcon paused={!playingRecap} />
                {playingRecap ? "Pause" : "Play voice"}
              </button>
            )}
            {!readOnly && (
              <button
                onClick={() => void generateWeeklyRecap(true)}
                disabled={generatingRecap || !hasEntries}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-medium text-stone-950 shadow-lg shadow-amber-500/15 transition-colors hover:bg-amber-400 disabled:opacity-50"
              >
                <SparkleIcon />
                {generatingRecap ? "Generating…" : "Generate recap"}
              </button>
            )}

            <div className="mt-auto pt-2">
              <RecapWaveform active={playingRecap} />
              <div className="mt-3 flex items-center gap-2 text-[0.65rem] tabular-nums text-stone-500">
                <span>{formatAudioTime(audioProgress)}</span>
                <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-stone-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-amber-500"
                    style={{ width: `${progressPct}%` }}
                  />
                  {weekly?.audioUrl && (
                    <div
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                      style={{ left: `calc(${progressPct}% - 5px)` }}
                    />
                  )}
                </div>
                <span>{formatAudioTime(audioDuration || 0)}</span>
              </div>
            </div>
          </div>
        </div>
        <audio ref={audioRef} className="hidden" />
      </section>

      {/* Worry threads */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-800/80 bg-stone-900/30 px-5 py-4">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800/80 ring-1 ring-stone-700/50">
            <ThreadsIcon />
          </span>
          <div>
            <h2 className="text-base font-medium text-stone-200">Mind threads</h2>
            <p className="text-sm text-stone-500">
              Explore recurring worries and bright spots from your journal.
            </p>
          </div>
        </div>
        <Link
          href="/threads"
          className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
        >
          Open threads →
        </Link>
      </section>

      {/* Recent entries + timeline */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-800/80 bg-stone-900/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium text-stone-100">Recent entries</h2>
            {hasEntries && entries.length > 4 && (
              <button
                onClick={() => setShowAllEntries((v) => !v)}
                className="text-xs text-amber-400/80 hover:text-amber-300"
              >
                {showAllEntries ? "Show less" : "View all"}
              </button>
            )}
          </div>

          {!hasEntries ? (
            <p className="text-sm text-stone-500">No entries yet. Start your first check-in.</p>
          ) : (
            <ul className="space-y-4">
              {visibleEntries.map((entry) => {
                const summary = entry.summary?.trim() ?? "";
                const expanded = expandedEntryIds.has(entry.id);
                const canExpand = summary.length > 72;

                return (
                  <li key={entry.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-800/80 text-stone-500">
                      <MicIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <time className="text-xs text-stone-500">
                          {formatEntryDate(entry.date)}
                        </time>
                        {entry.mood != null && (
                          <span className="shrink-0 text-xs tabular-nums text-amber-400/90">
                            {entry.mood.toFixed(1)}/10
                          </span>
                        )}
                      </div>
                      {summary ? (
                        <>
                          <p
                            className={`mt-1 text-sm text-stone-300 ${expanded ? "" : "line-clamp-1"}`}
                          >
                            {summary}
                          </p>
                          {canExpand && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedEntryIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(entry.id)) next.delete(entry.id);
                                  else next.add(entry.id);
                                  return next;
                                })
                              }
                              className="mt-1 text-xs text-amber-400/80 hover:text-amber-300"
                            >
                              {expanded ? "Show less" : "Read more"}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-stone-500">No summary yet.</p>
                      )}
                      {entry.themes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {entry.themes.map((t, i) => (
                            <span
                              key={t}
                              className={`rounded-full border px-2 py-0.5 text-[0.65rem] ${themeStyle(i)}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <EmotionalTimelineChart entries={entries} />
      </div>

      <p className="flex items-center justify-center gap-2 pt-2 text-center text-xs text-stone-600">
        <LockIcon />
        Your memory, your server.
      </p>

      <p className="text-center text-[0.65rem] text-stone-700">
        Voice Journal is a reflective companion, not medical or mental health treatment.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon?: string;
  label: string;
  value: string;
  sub: string;
  accent: "amber" | "stone" | "emerald" | "rose";
}) {
  const valueColors = {
    amber: "text-amber-400",
    stone: "text-stone-200",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
  };

  return (
    <div className="min-w-[100px] rounded-xl border border-stone-800/80 bg-stone-900/40 px-4 py-3">
      <p className="text-[0.6rem] font-medium uppercase tracking-wider text-stone-600">{label}</p>
      <p className={`mt-1 flex items-center gap-1 text-2xl font-light ${valueColors[accent]}`}>
        {icon && <span className="text-base">{icon}</span>}
        {value}
      </p>
      <p className="mt-0.5 text-[0.65rem] text-stone-500">{sub}</p>
    </div>
  );
}

function RecapWaveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-8 items-end justify-center gap-[3px]">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-gradient-to-t from-amber-700/30 to-amber-400/80 ${
            active ? "voice-wave-bar" : "opacity-40"
          }`}
          style={{
            height: `${8 + ((i * 5) % 24)}px`,
            ["--wave-duration" as string]: `${0.7 + (i % 4) * 0.15}s`,
            ["--wave-delay" as string]: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

function WaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" aria-hidden>
      <path d="M4 12h2M8 8v8M12 5v14M16 8v8M20 12h-1" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon({ paused }: { paused: boolean }) {
  return paused ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
    </svg>
  );
}

function ThreadsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-400" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="8" r="2" />
      <circle cx="19" cy="8" r="2" />
      <path d="M7 9l3 2M17 9l-3 2" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
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
