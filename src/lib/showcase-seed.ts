import { format, subDays } from "date-fns";
import {
  ensureUser,
  getRecentEntries,
  getCurrentWeekRange,
  saveJournalEntry,
  saveWeeklySummary,
  saveWorryThreadSnapshot,
} from "@/lib/memory";
import { SHOWCASE_USERS } from "@/lib/showcase-users";
import type { WorryThread, BrightThread } from "@/lib/types";

type SeedEntry = {
  transcript: string;
  summary: string;
  mood: number;
  themes: string[];
  openThread?: string;
};

const DEMO_ENTRIES: SeedEntry[] = [
  {
    transcript:
      "Work was overwhelming today. I had three deadlines and felt like I couldn't breathe. But I did a walk at lunch and it helped a little.",
    summary: "Overwhelmed by deadlines; a walk helped reset.",
    mood: 4.5,
    themes: ["work", "stress", "self-care"],
    openThread: "Workload and boundaries",
  },
  {
    transcript:
      "The presentation went better than expected. My manager said I nailed it. Still anxious underneath but I'm proud.",
    summary: "Presentation win — pride mixed with lingering anxiety.",
    mood: 7.0,
    themes: ["work", "achievement", "anxiety"],
  },
  {
    transcript: "Quiet day. Grateful for small things — good coffee, sunshine through the window.",
    summary: "Quiet gratitude day — small comforts mattered.",
    mood: 7.5,
    themes: ["gratitude", "calm", "mindfulness"],
  },
  {
    transcript:
      "Had a hard conversation with my partner. I cried in the shower afterward. Not a bad cry — a release cry.",
    summary: "Emotional release after a hard but honest conversation.",
    mood: 5.5,
    themes: ["relationships", "emotions", "healing"],
  },
  {
    transcript: "Feeling lighter. Started sketching ideas for the side project. Mood is a 7 today.",
    summary: "Creative energy returned on the side project.",
    mood: 7.0,
    themes: ["creativity", "projects", "optimism"],
  },
  {
    transcript:
      "Sunday reset. Noticed I've been journaling more consistently and it helps me see patterns in my anxiety.",
    summary: "Journaling habit revealing anxiety patterns.",
    mood: 7.2,
    themes: ["habits", "self-awareness", "anxiety"],
  },
  {
    transcript:
      "New week energy. Set three intentions: one for work, one for health, one for relationships.",
    summary: "Fresh week with clear intentions across life areas.",
    mood: 7.8,
    themes: ["intentions", "balance", "growth"],
  },
];

function entryDate(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
}

function seedDemoUser() {
  const userId = "demo-user";
  ensureUser(userId, "Demo");
  DEMO_ENTRIES.forEach((entry, index) => {
    const daysAgo = DEMO_ENTRIES.length - 1 - index;
    saveJournalEntry({
      userId,
      entryDate: entryDate(daysAgo),
      transcript: entry.transcript,
      summary: entry.summary,
      mood: entry.mood,
      themes: entry.themes,
      durationSeconds: 165 + index * 7,
      openThread: entry.openThread,
    });
  });

  const { start, end } = getCurrentWeekRange();
  saveWeeklySummary(
    userId,
    start,
    end,
    "A week of contrast: work stress and a breakthrough presentation, quiet gratitude, an emotional release in your relationship, and renewed creative energy. Journaling itself became part of the recovery arc.",
    [
      "Stress peaks mid-week; small resets (walks, coffee rituals) change the trajectory.",
      "Hard conversations led to release, not rupture.",
      "Side-project creativity correlates with lighter mood days.",
    ],
    {
      supportNote:
        "You're building a clearer map of what lifts you versus what drains you — that's the whole point of showing up daily.",
    }
  );

  const worries: WorryThread[] = [
    {
      id: "workload",
      title: "Work overload",
      summary: "Deadlines stacking up mid-week.",
      intensity: 7.0,
      trend: "fading",
      mentionCount: 2,
      firstSeen: entryDate(6),
      lastSeen: entryDate(5),
      focusPriority: 1,
      suggestedActions: ["Protect a 20-minute walk after lunch tomorrow."],
      relatedDates: [entryDate(6)],
    },
  ];
  const bright: BrightThread[] = [
    {
      id: "creative",
      title: "Side project spark",
      summary: "Sketching ideas again after a heavy few days.",
      intensity: 7.5,
      trend: "rising",
      mentionCount: 2,
      firstSeen: entryDate(2),
      lastSeen: entryDate(1),
      focusPriority: 1,
      suggestedActions: ["Block 30 minutes for the side project sketch."],
      relatedDates: [entryDate(2), entryDate(1)],
    },
  ];
  saveWorryThreadSnapshot(
    userId,
    worries,
    "Protect one boundary at work tomorrow — one meeting you skip or shorten.",
    bright,
    "Notice one small win from this week and say it out loud."
  );
}

export function ensureShowcaseSeeded(userId: string) {
  if (getRecentEntries(userId, 1).length > 0) return;
  if (userId === "demo-user") seedDemoUser();
}

export function ensureAllShowcasesSeeded() {
  for (const user of SHOWCASE_USERS) {
    ensureShowcaseSeeded(user.id);
  }
}
