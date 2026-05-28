"use client";

type TimerRingProps = {
  secondsLeft: number;
  totalSeconds: number;
  isActive: boolean;
  agentSpeaking?: boolean;
  /** When the voice link dropped but we are still saving */
  isEnding?: boolean;
};

export function TimerRing({
  secondsLeft,
  totalSeconds,
  isActive,
  agentSpeaking = false,
  isEnding = false,
}: TimerRingProps) {
  const progress = 1 - secondsLeft / totalSeconds;
  const circumference = 2 * Math.PI * 92;
  const offset = circumference * (1 - progress);
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const urgent = secondsLeft <= 30;
  const ringColor = urgent ? "#fb7185" : "#f59e0b";

  const statusLabel = isEnding
    ? "saving"
    : !isActive
      ? "ready"
      : agentSpeaking
        ? "speaking"
        : "listening";

  return (
    <div className="relative flex h-[17rem] w-[17rem] items-center justify-center">
      {isActive && (
        <div
          className="timer-ambient absolute inset-6 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 70%)`,
          }}
        />
      )}

      <svg
        className="absolute h-full w-full -rotate-90"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="3"
        />
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
          style={{
            filter: isActive
              ? `drop-shadow(0 0 10px ${urgent ? "rgba(251,113,133,0.5)" : "rgba(245,158,11,0.55)"})`
              : undefined,
          }}
        />
      </svg>

      <div className="relative text-center">
        <p className="text-[3.25rem] font-extralight tabular-nums tracking-tight text-stone-50">
          {mins}:{secs.toString().padStart(2, "0")}
        </p>
        <p
          className={`mt-2 text-[0.65rem] font-medium uppercase tracking-[0.28em] ${
            isActive
              ? agentSpeaking
                ? "text-amber-400"
                : "text-stone-500"
              : "text-stone-600"
          }`}
        >
          {statusLabel}
        </p>
      </div>
    </div>
  );
}
