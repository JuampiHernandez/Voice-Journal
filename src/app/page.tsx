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
            ElevenLabs powers the voice layer; you own everything that makes this product magical.
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
