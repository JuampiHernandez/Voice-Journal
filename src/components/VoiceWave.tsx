"use client";

type VoiceWaveProps = {
  active: boolean;
  bars?: number;
  className?: string;
  variant?: "agent" | "user";
};

export function VoiceWave({
  active,
  bars = 14,
  className = "",
  variant = "agent",
}: VoiceWaveProps) {
  if (!active) return null;

  const barClass =
    variant === "agent"
      ? "bg-gradient-to-t from-amber-600/40 to-amber-400"
      : "bg-gradient-to-t from-stone-600/30 to-stone-400/60";

  return (
    <div
      className={`flex h-10 items-end justify-center gap-[3px] ${className}`}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => {
        const height = 10 + ((i * 7) % 22);
        const duration = 0.75 + (i % 5) * 0.12;
        const delay = i * 0.06;

        return (
          <span
            key={i}
            className={`voice-wave-bar w-[3px] rounded-full ${barClass}`}
            style={{
              height: `${height}px`,
              ["--wave-duration" as string]: `${duration}s`,
              ["--wave-delay" as string]: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
