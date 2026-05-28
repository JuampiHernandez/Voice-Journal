import Image from "next/image";
import Link from "next/link";

const BENEFITS = [
  {
    title: "Ultra-low latency voice",
    desc: "Scribe v2 Realtime (~150ms STT) and Flash TTS (~75ms) for natural back-and-forth.",
  },
  {
    title: "One integrated pipeline",
    desc: "Speech-to-text, text-to-speech, and voice orchestration — no stitching vendors together.",
  },
  {
    title: "Bring your own LLM",
    desc: "Your prompts, tools, and long-term journal memory stay on your server.",
  },
  {
    title: "Smart turn-taking",
    desc: "Built-in interruption handling — users can cut in mid-response, just like a real conversation.",
  },
] as const;

export function SpeechEngineBenefits() {
  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-stone-800/80 bg-gradient-to-br from-stone-900/50 via-stone-950/80 to-stone-950 px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src="/elevenlabs-logo-white.svg"
              alt="ElevenLabs"
              width={140}
              height={18}
              className="h-[1.125rem] w-auto opacity-95"
            />
            <span className="rounded-full border border-stone-700 bg-stone-900 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-stone-400">
              Speech Engine
            </span>
          </div>

          <h2 className="mt-5 text-lg font-medium leading-snug text-stone-100 sm:text-xl">
            ElevenLabs handles the voice layer.
            <span className="text-stone-500"> You own the agent.</span>
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            Attach Speech Engine to your server and get real-time voice without rebuilding your stack.
            ElevenLabs captures audio, transcribes it, and speaks responses — your LLM decides what to say.
          </p>

          <Link
            href="https://elevenlabs.io/speech-engine"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-amber-300"
          >
            Learn about Speech Engine
            <span aria-hidden>→</span>
          </Link>
        </div>

        <ul className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="rounded-xl border border-stone-800/70 bg-stone-950/40 px-4 py-3.5"
            >
              <div className="flex items-start gap-2.5">
                <CheckIcon />
                <div>
                  <p className="text-sm font-medium text-stone-200">{benefit.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">{benefit.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 shrink-0 text-amber-500"
      aria-hidden
    >
      <path
        d="M5 12l4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
