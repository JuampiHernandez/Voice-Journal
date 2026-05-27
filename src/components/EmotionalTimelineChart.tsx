"use client";

import { parseISO, format, subDays, eachDayOfInterval } from "date-fns";

type MoodPoint = {
  label: string;
  date: string;
  mood: number | null;
};

type EmotionalTimelineChartProps = {
  entries: { date: string; mood: number | null }[];
  days?: number;
};

export function EmotionalTimelineChart({ entries, days = 7 }: EmotionalTimelineChartProps) {
  const end = new Date();
  const start = subDays(end, days - 1);
  const interval = eachDayOfInterval({ start, end });

  const moodByDate = new Map(entries.map((e) => [e.date, e.mood]));

  const points: MoodPoint[] = interval.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      label: format(d, "EEE"),
      date: format(d, "MMM d"),
      mood: moodByDate.get(key) ?? null,
    };
  });

  const values = points.map((p) => p.mood).filter((m): m is number => m != null);
  const hasData = values.length > 0;

  const width = 320;
  const height = 140;
  const padX = 28;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const coords = points.map((p, i) => {
    const x = padX + (i / Math.max(points.length - 1, 1)) * chartW;
    const y =
      p.mood != null ? padY + chartH - (p.mood / 10) * chartH : padY + chartH;
    return { ...p, x, y, hasMood: p.mood != null };
  });

  const linePoints = coords.filter((c) => c.hasMood);
  const polyline =
    linePoints.length > 0
      ? linePoints.map((c) => `${c.x},${c.y}`).join(" ")
      : "";

  const areaPath =
    linePoints.length > 0
      ? `M ${linePoints[0].x} ${padY + chartH} ` +
        linePoints.map((c) => `L ${c.x} ${c.y}`).join(" ") +
        ` L ${linePoints[linePoints.length - 1].x} ${padY + chartH} Z`
      : "";

  return (
    <div className="rounded-2xl border border-stone-800/80 bg-stone-900/30 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-medium text-stone-100">Emotional timeline</h2>
        <span className="rounded-full border border-stone-700 px-2.5 py-0.5 text-[0.65rem] text-stone-500">
          7 days
        </span>
      </div>

      {!hasData ? (
        <p className="py-8 text-center text-sm text-stone-600">Check in to see your mood trend.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full" aria-hidden>
          {[0, 5, 10].map((tick) => {
            const y = padY + chartH - (tick / 10) * chartH;
            return (
              <g key={tick}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text x={4} y={y + 3} fill="#57534e" fontSize="9">
                  {tick}
                </text>
              </g>
            );
          })}

          {areaPath && (
            <path d={areaPath} fill="url(#moodFill)" opacity="0.35" />
          )}

          <defs>
            <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {polyline && (
            <polyline
              points={polyline}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {linePoints.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#f59e0b" stroke="#0c0a09" strokeWidth="1.5" />
          ))}

          {coords.map((c, i) => (
            <text
              key={i}
              x={c.x}
              y={height + 14}
              textAnchor="middle"
              fill="#78716c"
              fontSize="9"
            >
              {c.label}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

export function formatEntryDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

const THEME_STYLES = [
  "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "border-rose-500/30 bg-rose-500/10 text-rose-300",
  "border-sky-500/30 bg-sky-500/10 text-sky-300",
  "border-violet-500/30 bg-violet-500/10 text-violet-300",
];

export function themeStyle(index: number): string {
  return THEME_STYLES[index % THEME_STYLES.length];
}

export function formatAudioTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
