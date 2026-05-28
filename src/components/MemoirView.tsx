"use client";

import { useEffect, useRef, useState } from "react";
import { useJournalUser } from "@/hooks/useJournalUser";

export function MemoirView() {
  const { userId, ready } = useJournalUser();
  const [generating, setGenerating] = useState(false);
  const [memoir, setMemoir] = useState<{
    script: string;
    narrationUrl: string;
    musicUrl: string;
    entryCount?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const narrationRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const year = new Date().getFullYear();

  useEffect(() => {
    if (!ready) return;
    fetch(`/api/memoir?userId=${encodeURIComponent(userId)}&year=${year}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.exists) {
          setMemoir({
            script: data.script,
            narrationUrl: data.narrationUrl,
            musicUrl: data.musicUrl,
          });
        }
      });
  }, [year, ready, userId]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/memoir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, year }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMemoir(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function togglePlay() {
    if (!narrationRef.current || !musicRef.current) return;
    if (playing) {
      narrationRef.current.pause();
      musicRef.current.pause();
      setPlaying(false);
    } else {
      narrationRef.current.volume = 1;
      musicRef.current.volume = 0.15;
      narrationRef.current.play();
      musicRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-900/80 to-amber-950/20 p-8">
        <h2 className="text-2xl font-light text-stone-100">Your {year} Memoir</h2>
        <p className="mt-2 text-stone-400 max-w-lg">
          At year&apos;s end, Voice Journal weaves your daily check-ins into a fully narrated audio
          memoir — voice by ElevenLabs TTS, score by Eleven Music API.
        </p>

        {!memoir ? (
          <button
            onClick={generate}
            disabled={generating}
            className="mt-6 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-medium text-stone-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {generating ? "Generating memoir (this takes ~1 min)…" : "Generate my memoir"}
          </button>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={togglePlay}
              className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-medium text-stone-950 hover:bg-amber-400 transition-colors"
            >
              {playing ? "Pause" : "Play memoir"}
            </button>
            <button
              onClick={generate}
              disabled={generating}
              className="rounded-full border border-stone-600 px-6 py-2.5 text-sm text-stone-300 hover:bg-stone-800"
            >
              Regenerate
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

        {memoir && (
          <>
            <audio ref={narrationRef} src={memoir.narrationUrl} onEnded={() => setPlaying(false)} />
            <audio ref={musicRef} src={memoir.musicUrl} loop />
            {memoir.entryCount && (
              <p className="mt-3 text-xs text-stone-500">
                Woven from {memoir.entryCount} journal entries
              </p>
            )}
          </>
        )}
      </div>

      {memoir?.script && (
        <section className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6">
          <h3 className="text-sm uppercase tracking-wider text-stone-500 mb-4">Narration script</h3>
          <div className="prose prose-invert prose-sm max-w-none text-stone-300 leading-relaxed whitespace-pre-line">
            {memoir.script}
          </div>
        </section>
      )}
    </div>
  );
}
