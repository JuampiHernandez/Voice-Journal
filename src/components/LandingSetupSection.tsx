"use client";

import { useState } from "react";

const STEPS = [
  {
    id: "install",
    number: 1,
    title: "Install",
    desc: "Clone the repo and install deps",
    code: `git clone https://github.com/JuampiHernandez/Voice-Journal.git
cd Voice-Journal
npm install
cp .env.example .env`,
  },
  {
    id: "configure",
    number: 2,
    title: "Configure",
    desc: "Add your keys to .env",
    code: `ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key`,
  },
  {
    id: "run",
    number: 3,
    title: "Run",
    desc: "Start the Speech Engine locally",
    code: `npm run dev:full

# Open:
http://localhost:3001/journal`,
  },
] as const;

export function LandingSetupSection() {
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS[activeStep];

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-stone-950/60 p-6 sm:p-8">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-500/80">Get started locally</p>
          <p className="mt-1 text-sm text-stone-500">Select a step to view its commands</p>
        </div>
        <p className="text-xs text-stone-600">
          Step {activeStep + 1} of {STEPS.length}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_1.05fr] lg:items-start">
        <div
          className="flex flex-col gap-2"
          role="tablist"
          aria-label="Setup steps"
        >
          {STEPS.map((s, i) => {
            const active = i === activeStep;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`setup-panel-${s.id}`}
                id={`setup-tab-${s.id}`}
                onClick={() => setActiveStep(i)}
                className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                  active
                    ? "border-amber-500/50 bg-amber-500/[0.08] shadow-[0_0_24px_-8px_rgba(245,158,11,0.35)]"
                    : "border-stone-800 bg-stone-900/30 hover:border-stone-700 hover:bg-stone-900/60"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-amber-500 text-stone-950"
                      : "border border-stone-700 bg-stone-950 text-stone-400 group-hover:border-stone-600 group-hover:text-stone-300"
                  }`}
                >
                  {s.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`flex items-center gap-2 text-sm font-medium ${
                      active ? "text-stone-100" : "text-stone-400 group-hover:text-stone-200"
                    }`}
                  >
                    {s.title}
                    {!active && (
                      <span className="text-[0.65rem] font-normal text-stone-600 opacity-0 transition-opacity group-hover:opacity-100">
                        View commands →
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-600">{s.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        <CopyableTerminal
          id={`setup-panel-${step.id}`}
          labelledBy={`setup-tab-${step.id}`}
          title={step.title}
          code={step.code}
        />
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-600">
        <LockIcon />
        Works on macOS, Linux, or your VPS.
      </p>
    </section>
  );
}

function CopyableTerminal({
  id,
  labelledBy,
  title,
  code,
}: {
  id: string;
  labelledBy: string;
  title: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="relative overflow-hidden rounded-xl border border-stone-800 bg-black/70"
    >
      <div className="flex items-center justify-between border-b border-stone-800/80 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-700" />
          </div>
          <span className="text-[0.65rem] text-stone-600">{title}</span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-stone-700 px-2.5 py-1 text-[0.65rem] text-stone-400 transition-colors hover:border-amber-500/50 hover:text-amber-200"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-stone-400">
        <code>{code}</code>
      </pre>
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
