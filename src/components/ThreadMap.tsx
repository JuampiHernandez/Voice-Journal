"use client";

import { parseISO, format } from "date-fns";

export type ThreadMapItem = {
  id: string;
  title: string;
  intensity: number;
  trend: "rising" | "stable" | "fading";
  focusPriority: number;
};

const WORRY_TREND_ORB = {
  rising: { fill: "#f97316", glow: "rgba(249,115,22,0.35)", ring: "rgba(251,146,60,0.4)" },
  stable: { fill: "#a8a29e", glow: "rgba(168,162,158,0.2)", ring: "rgba(214,211,209,0.25)" },
  fading: { fill: "#34d399", glow: "rgba(52,211,153,0.25)", ring: "rgba(110,231,183,0.3)" },
};

const BRIGHT_TREND_ORB = {
  rising: { fill: "#34d399", glow: "rgba(52,211,153,0.35)", ring: "rgba(110,231,183,0.4)" },
  stable: { fill: "#a8a29e", glow: "rgba(168,162,158,0.2)", ring: "rgba(214,211,209,0.25)" },
  fading: { fill: "#fbbf24", glow: "rgba(251,191,36,0.25)", ring: "rgba(252,211,77,0.3)" },
};

function orbPositions(count: number): { x: number; y: number }[] {
  if (count === 0) return [];
  if (count === 1) return [{ x: 400, y: 160 }];

  const layouts: Record<number, { x: number; y: number }[]> = {
    2: [
      { x: 280, y: 145 },
      { x: 520, y: 155 },
    ],
    3: [
      { x: 400, y: 100 },
      { x: 210, y: 245 },
      { x: 590, y: 240 },
    ],
    4: [
      { x: 400, y: 88 },
      { x: 630, y: 175 },
      { x: 170, y: 180 },
      { x: 400, y: 268 },
    ],
    5: [
      { x: 400, y: 78 },
      { x: 650, y: 145 },
      { x: 150, y: 150 },
      { x: 270, y: 265 },
      { x: 530, y: 260 },
    ],
  };

  if (layouts[count]) return layouts[count];

  const cx = 400;
  const cy = 170;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const radius = 140 + (i % 2) * 30;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius * 0.6,
    };
  });
}

function orbRadius(intensity: number): number {
  return 12 + (intensity / 10) * 16;
}

function splitTitle(title: string): [string, string?] {
  if (title.length <= 24) return [title];
  const words = title.split(" ");
  if (words.length <= 2) return [title];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

type ThreadMapProps = {
  threads: ThreadMapItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  variant?: "worry" | "bright";
  intensityLabel?: string;
};

export function ThreadMap({
  threads,
  activeId,
  onSelect,
  variant = "worry",
  intensityLabel = "Mental load",
}: ThreadMapProps) {
  const trendOrb = variant === "bright" ? BRIGHT_TREND_ORB : WORRY_TREND_ORB;
  const sorted = [...threads].sort((a, b) => a.focusPriority - b.focusPriority);
  const positions = orbPositions(sorted.length);

  const connections: [number, number][] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    connections.push([i, i + 1]);
  }
  if (sorted.length > 2) {
    connections.push([0, sorted.length - 1]);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-stone-800/70 bg-stone-950/50 px-2 py-3 sm:px-4">
      <svg
        viewBox="0 0 800 320"
        preserveAspectRatio="xMidYMid meet"
        className="mx-auto block h-[clamp(250px,32vh,340px)] w-full"
        role="img"
        aria-label={
          variant === "bright"
            ? "Visual map of bright threads"
            : "Visual map of worry threads"
        }
      >
        <defs>
          {sorted.map((thread) => {
            const colors = trendOrb[thread.trend];
            return (
              <radialGradient key={`grad-${thread.id}`} id={`orb-${thread.id}`}>
                <stop offset="0%" stopColor={colors.fill} stopOpacity="0.95" />
                <stop offset="65%" stopColor={colors.fill} stopOpacity="0.45" />
                <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
              </radialGradient>
            );
          })}
        </defs>

        {[
          [80, 40], [720, 50], [60, 270], [740, 265], [400, 32],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1" fill="white" opacity={0.12 + (i % 2) * 0.06} />
        ))}

        <ellipse
          cx="400"
          cy="165"
          rx="310"
          ry="115"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />
        <ellipse
          cx="400"
          cy="165"
          rx="200"
          ry="72"
          fill="none"
          stroke="rgba(255,255,255,0.025)"
          strokeWidth="1"
        />

        {connections.map(([a, b], i) => {
          const p1 = positions[a];
          const p2 = positions[b];
          if (!p1 || !p2) return null;
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
          );
        })}

        {sorted.map((thread, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const r = orbRadius(thread.intensity);
          const colors = trendOrb[thread.trend];
          const active = activeId === thread.id;
          const [line1, line2] = splitTitle(thread.title);
          const labelY = pos.y + r + 18;

          return (
            <g
              key={thread.id}
              className={onSelect ? "cursor-pointer" : undefined}
              onClick={() => onSelect?.(thread.id)}
              role={onSelect ? "button" : undefined}
              aria-label={`${thread.title}, ${thread.intensity.toFixed(1)} out of 10 ${intensityLabel.toLowerCase()}, ${thread.trend}`}
              aria-pressed={active}
            >
              {active && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r + 10}
                  fill="none"
                  stroke="rgba(245,158,11,0.5)"
                  strokeWidth="1.25"
                />
              )}
              <circle cx={pos.x} cy={pos.y} r={r + 6} fill={colors.glow} opacity={active ? 0.45 : 0.3} />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={`url(#orb-${thread.id})`}
                stroke={active ? "rgba(245,158,11,0.65)" : colors.ring}
                strokeWidth={active ? 1.5 : 1.25}
              />
              <text
                x={pos.x}
                y={labelY}
                textAnchor="middle"
                fill={active ? "#fafaf9" : "#e7e5e4"}
                fontSize="13"
                fontWeight="500"
              >
                {line1}
              </text>
              {line2 && (
                <text
                  x={pos.x}
                  y={labelY + 16}
                  textAnchor="middle"
                  fill={active ? "#fafaf9" : "#e7e5e4"}
                  fontSize="13"
                  fontWeight="500"
                >
                  {line2}
                </text>
              )}
              <text
                x={pos.x}
                y={labelY + (line2 ? 34 : 18)}
                textAnchor="middle"
                fill="#a8a29e"
                fontSize="11"
              >
                {thread.intensity.toFixed(1)}/10 ·{" "}
                {thread.trend.charAt(0).toUpperCase() + thread.trend.slice(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function formatThreadDateRange(firstSeen: string, lastSeen: string): string {
  try {
    const start = format(parseISO(firstSeen), "MMM d");
    const end = format(parseISO(lastSeen), "MMM d");
    return firstSeen === lastSeen ? start : `${start} – ${end}`;
  } catch {
    return `${firstSeen} – ${lastSeen}`;
  }
}
