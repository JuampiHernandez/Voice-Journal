"use client";

import { useState } from "react";
import Link from "next/link";

const cloneCommands = `git clone https://github.com/JuampiHernandez/Voice-Journal.git
cd Voice-Journal
npm install
cp .env.example .env`;

const envTemplate = `ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ALLOW_GUEST_JOURNAL=true`;

const firstRunCommands = `ngrok http 3002

# In a second terminal:
npm run setup:speech-engine`;

const dailyRunCommands = `npm run dev:full

# Open:
http://localhost:3001/journal?user=YourName`;

type LocalSetupGuideProps = {
  compact?: boolean;
  source?: "home" | "checkin";
};

export function LocalSetupGuide({ compact = false, source = "home" }: LocalSetupGuideProps) {
  return (
    <section
      className={`w-full rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] ${
        compact ? "p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-amber-400/80">
            Local voice mode
          </p>
          <h2 className="mt-2 text-xl font-medium text-stone-100">
            Voice check-ins run on localhost + ngrok
          </h2>
        </div>
        {source === "home" && (
          <Link
            href="/journal"
            className="rounded-full border border-amber-500/40 px-4 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/10"
          >
            Check-in page
          </Link>
        )}
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-400">
        The deployed site is for demo dashboards, insights, threads, and memoirs. Live voice needs a
        local Speech Engine process, because the browser talks to your machine through ngrok.
      </p>

      <div className="mt-6 grid gap-4">
        <SetupStep number="1" title="Clone and install" code={cloneCommands} />
        <SetupStep
          number="2"
          title="Fill .env"
          code={envTemplate}
          helper="Paste your own keys into .env. Apply the Supabase SQL migration from supabase/migrations first."
        />
        <SetupStep
          number="3"
          title="First time only: create the Speech Engine"
          code={firstRunCommands}
          helper="Keep ngrok running. The setup script auto-detects the ngrok URL and writes SPEECH_ENGINE_ID + SPEECH_ENGINE_WS_URL into .env."
        />
        <SetupStep
          number="4"
          title="Every time after that"
          code={dailyRunCommands}
          helper="dev:full starts ngrok, the Speech Engine, syncs ElevenLabs, and starts Next.js on port 3001."
        />
      </div>
    </section>
  );
}

function SetupStep({
  number,
  title,
  code,
  helper,
}: {
  number: string;
  title: string;
  code: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-stone-950">
          {number}
        </span>
        <h3 className="text-sm font-medium text-stone-200">{title}</h3>
      </div>
      <CopyableCode code={code} />
      {helper && <p className="mt-3 text-xs leading-relaxed text-stone-500">{helper}</p>}
    </div>
  );
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl border border-stone-800 bg-black/60 p-4 pr-24 text-xs leading-relaxed text-stone-300">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-[0.7rem] text-stone-300 transition-colors hover:border-amber-500/60 hover:text-amber-200"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
