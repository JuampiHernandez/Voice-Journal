import { LandingCheckInPreview } from "@/components/LandingCheckInPreview";
import { LandingSetupSection } from "@/components/LandingSetupSection";
import { ProductionOnly } from "@/components/ProductionOnly";
import { ShowcaseUserPicker } from "@/components/ShowcaseUserPicker";
import { HeroCta } from "@/components/HeroCta";
import { SpeechEngineBenefits } from "@/components/SpeechEngineBenefits";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/15 via-stone-950 to-stone-950" />

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-16 lg:pb-20">
        {/* Hero */}
        <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-500/90">
              Private. Local. Your story.
            </p>

            <h1 className="mt-5 text-4xl font-light leading-[1.1] tracking-tight text-stone-50 sm:text-5xl lg:text-[3.25rem]">
              Daily 3-minute check-ins that become your{" "}
              <span className="text-amber-400">yearly memoir.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-stone-500 sm:text-lg">
              A private voice companion that grows with you. Local-first. AI-powered. Always yours.
            </p>

            <HeroCta />
          </div>

          <LandingCheckInPreview />
        </section>

        {/* Judges — production only */}
        <ProductionOnly>
          <section className="mt-20 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
            <h2 className="text-lg font-medium text-amber-200/90">For judges &amp; visitors</h2>
            <ul className="mt-4 space-y-2 text-sm text-stone-400">
              <li>
                <strong className="text-stone-300">On this site:</strong> open the demo journal →
                explore Insights, Threads, and Memoir. View-only — no voice input here.
              </li>
              <li>
                <strong className="text-stone-300">Live voice check-in:</strong> fork the repo, run{" "}
                <code className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-200/90">
                  npm run dev:full
                </code>{" "}
                on localhost with ngrok.
              </li>
            </ul>
            <div className="mt-6">
              <ShowcaseUserPicker />
            </div>
          </section>
        </ProductionOnly>

        {/* Features */}
        <section className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <Feature
            icon={<MicIcon />}
            title="Speech Engine"
            desc="Local AI turns your voice into memory."
          />
          <Feature
            icon={<CalendarIcon />}
            title="Weekly recap"
            desc="AI summaries of what mattered, privately."
          />
          <Feature
            icon={<ThreadsIcon />}
            title="Threads"
            desc="Visual maps of your thoughts over time."
          />
          <Feature
            icon={<MusicIcon />}
            title="Year-end memoir"
            desc="A narrated memoir generated with Eleven Music API."
          />
        </section>

        {/* Setup */}
        <div className="mt-20">
          <LandingSetupSection />
        </div>

        <SpeechEngineBenefits />
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
        {icon}
      </span>
      <h3 className="mt-4 text-sm font-medium text-stone-200">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{desc}</p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 9h16M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThreadsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.5l3.5 8M16 7.5l-3.5 8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18V6l10-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
