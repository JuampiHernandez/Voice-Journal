"use client";

import { TimerRing } from "./TimerRing";
import { VoiceWave } from "./VoiceWave";

export function LandingCheckInPreview() {
  return (
    <div
      aria-label="Preview of an active voice check-in session"
      className="pointer-events-none relative select-none rounded-2xl border border-amber-500/30 bg-stone-950/80 p-6 shadow-[0_0_60px_-12px_rgba(245,158,11,0.25)]"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-sm font-medium text-stone-200">Today&apos;s check-in</span>
        <span className="hidden text-xs text-stone-600 sm:inline">· Local mode</span>
      </div>

      <div className="relative mt-6 flex flex-col items-center">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-40">
          <VoiceWave active bars={24} className="h-16" />
        </div>

        <div className="relative">
          <TimerRing
            secondsLeft={137}
            totalSeconds={180}
            isActive
            agentSpeaking={false}
            showStatusLabel={false}
          />
          <p className="absolute inset-x-0 bottom-[3.25rem] text-center text-[0.65rem] uppercase tracking-[0.2em] text-stone-500">
            Speak freely
          </p>
        </div>

        <p className="mt-2 text-sm text-stone-500">Listening…</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-stone-800/80 pt-4 text-[0.65rem] text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Speech Engine
        </span>
        <span className="flex items-center gap-1.5">
          <LockIcon />
          Private &amp; encrypted
        </span>
        <span className="flex items-center gap-1.5">
          <ServerIcon />
          Your server
        </span>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6V10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="7" r="1" fill="currentColor" />
      <circle cx="8" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}
