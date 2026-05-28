import Link from "next/link";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950 to-stone-950" />

      <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-amber-500/80">
          #ElevenHacks · Speech Engine
        </p>

        <h1 className="max-w-2xl text-4xl sm:text-6xl font-light leading-tight text-stone-50">
          Daily 3-min check-ins that become your{" "}
          <span className="text-amber-400">yearly memoir</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-stone-400 leading-relaxed">
          A voice companion that remembers you — not just a dump folder. Daily check-ins with
          emotional support, worry-thread maps, weekly voice recaps, and a narrated year-end memoir.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/journal"
            className="rounded-full bg-amber-500 px-8 py-3.5 text-sm font-medium text-stone-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/25"
          >
            Start today&apos;s check-in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-stone-700 px-8 py-3.5 text-sm text-stone-300 hover:bg-stone-900 transition-colors"
          >
            See what the AI noticed
          </Link>
        </div>

        <blockquote className="mt-16 max-w-lg border-l-2 border-amber-500/50 pl-5 text-stone-400 italic">
          &ldquo;I voice-journaled every day for a month. Here&apos;s what the AI noticed.&rdquo;
          <span className="mt-2 block text-xs not-italic text-stone-600">— 5-sec TikTok hook</span>
        </blockquote>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="Speech Engine"
            desc="ElevenLabs handles STT + TTS. Your server owns the LLM logic, memory, and analysis."
          />
          <Feature
            title="Weekly voice recap"
            desc="Your companion reads back what it noticed each week — insights, patterns, and a voice summary."
          />
          <Feature
            title="Threads & support"
            desc="Visual map of what's weighing on you — with focus suggestions and weekly voice recaps."
          />
          <Feature
            title="Eleven Music memoir"
            desc="Year-end narrative TTS + ambient score generated via Eleven Music API."
          />
        </div>

        <section className="mt-20 rounded-2xl border border-stone-800 bg-stone-900/40 p-8">
          <h2 className="text-lg font-medium text-stone-200">Why Speech Engine, not ElevenAgents?</h2>
          <p className="mt-3 text-sm text-stone-400 leading-relaxed max-w-2xl">
            ElevenAgents is optimized for managed, low-latency voice agents — but long-running
            personalized memory (a year of journal entries, emotional timelines, weekly pattern
            analysis) belongs on <em>your</em> infrastructure. Speech Engine is the perfect split:
            ElevenLabs powers the voice layer; your database owns the journal — not Eleven&apos;s agent
            memory.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
          <h2 className="text-lg font-medium text-amber-200/90">Try it (judges &amp; visitors)</h2>
          <ul className="mt-4 space-y-2 text-sm text-stone-400">
            <li>
              <strong className="text-stone-300">Web (no install):</strong> open the deployed app →{" "}
              <Link href="/dashboard" className="text-amber-400 hover:underline">
                Insights
              </Link>{" "}
              → <em>Load demo week</em> → generate weekly recap → Memoir.
            </li>
            <li>
              <strong className="text-stone-300">Your own data:</strong> add{" "}
              <code className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-200/90">?user=YourName</code>{" "}
              to any URL, or sign in with a magic link (nav bar).
            </li>
            <li>
              <strong className="text-stone-300">Live voice:</strong> needs Speech Engine hosted
              (see deploy docs) — insights &amp; memoir work without it.
            </li>
          </ul>
        </section>

        <section className="mt-12 rounded-2xl border border-stone-800 bg-stone-900/40 p-8">
          <h2 className="text-lg font-medium text-stone-200">Run locally (full Speech Engine)</h2>
          <p className="mt-2 text-sm text-stone-500">
            Prefer your machine? Same app, Supabase for storage — voice via ngrok.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-stone-800 bg-stone-950 p-4 text-xs text-stone-400 leading-relaxed">
{`npm install
cp .env.example .env
# Fill: ELEVENLABS_API_KEY, OPENAI_API_KEY, Supabase keys
# Apply supabase/migrations/*.sql in Supabase SQL editor
# Create Storage bucket: journal-audio (private)

npm run dev                    # Next.js → http://localhost:3001
npm run speech-engine          # Terminal 2
ngrok http 3002                # Terminal 3 → set SPEECH_ENGINE_WS_URL in .env
npm run setup:speech-engine    # once

ALLOW_GUEST_JOURNAL=true       # optional: ?user= judge ids without email`}
          </pre>
          <p className="mt-4 text-xs text-stone-600">
            See <code className="text-stone-500">docs/DEPLOY.md</code> for Vercel + Supabase + Railway
            speech-engine setup.
          </p>
        </section>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-stone-800/80 bg-stone-900/30 p-6">
      <h3 className="font-medium text-amber-200/90">{title}</h3>
      <p className="mt-2 text-sm text-stone-500 leading-relaxed">{desc}</p>
    </div>
  );
}
