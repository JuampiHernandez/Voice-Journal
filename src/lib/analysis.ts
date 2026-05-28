import OpenAI from "openai";
import { z } from "zod";
import type { BrightThread, WorryThread } from "./types";

const AnalysisSchema = z.object({
  summary: z.string(),
  mood: z.number().min(0).max(10),
  themes: z.array(z.string()),
  openThread: z.string().nullable(),
  microAction: z.string().nullable(),
  emotionalMoments: z.array(
    z.object({
      description: z.string(),
      emotion: z.string(),
      intensity: z.number().min(0).max(1),
    })
  ),
});

export type EntryAnalysis = z.infer<typeof AnalysisSchema>;

const WeeklySchema = z.object({
  summary: z.string(),
  insights: z.array(z.string()),
  supportNote: z.string(),
});

const ThreadItemSchema = z.object({
  title: z.string(),
  summary: z.string(),
  intensity: z.number().min(0).max(10),
  trend: z.enum(["rising", "stable", "fading"]),
  mentionCount: z.number(),
  firstSeen: z.string(),
  lastSeen: z.string(),
  focusPriority: z.number().min(1).max(5),
  suggestedActions: z.array(z.string()),
  relatedDates: z.array(z.string()),
});

const MindThreadsSchema = z.object({
  focusRecommendation: z.string(),
  celebrateRecommendation: z.string(),
  worryThreads: z.array(ThreadItemSchema),
  brightThreads: z.array(ThreadItemSchema),
});

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for journal analysis");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function analyzeTranscript(transcript: string): Promise<EntryAnalysis> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You analyze voice journal transcripts for a supportive companion app (not clinical therapy).
Return JSON:
- summary: 2-3 sentences, second person, warm and specific
- mood: 0-10 float
- themes: 2-5 short tags
- openThread: one unresolved topic to follow up tomorrow (or null)
- microAction: ONE small actionable step for the next 24 hours (or null if not appropriate)
- emotionalMoments: notable beats (empty if none)`,
      },
      { role: "user", content: transcript },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return AnalysisSchema.parse(JSON.parse(raw));
}

export async function generateWeeklySummary(
  entries: { date: string; summary: string; mood: number | null; themes: string[] }[],
  options?: { demoLabel?: string }
): Promise<{ summary: string; insights: string[]; supportNote: string }> {
  const openai = getOpenAI();
  const label = options?.demoLabel ?? "this week";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You write weekly voice journal recaps for ${label}. Tone: caring companion — reflective, emotionally supportive, practical (not clinical).
Return JSON:
- summary: 3-4 paragraphs, second person. Name patterns, validate feelings, note growth.
- insights: 3-5 bullets — what you "noticed" (mood shifts, recurring worries, wins)
- supportNote: 2-3 sentences — one compassionate observation + one gentle challenge for next week`,
      },
      { role: "user", content: JSON.stringify(entries, null, 2) },
    ],
  });

  const raw = WeeklySchema.parse(JSON.parse(response.choices[0]?.message?.content ?? "{}"));
  return {
    summary: raw.summary,
    insights: raw.insights,
    supportNote: raw.supportNote,
  };
}

/** Short script for weekly voice recap TTS (~90–120 seconds spoken) */
export async function generateWeeklyVoiceScript(
  summary: string,
  insights: string[],
  supportNote: string
): Promise<string> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Turn this weekly journal recap into a spoken script for the user to listen to.
Rules:
- Second person ("You...")
- Warm companion voice, not a doctor
- ~180-220 words (about 90 seconds spoken)
- Open with a hook, cover 2-3 patterns, end with supportNote woven in
- No markdown, stage directions, or bullet lists — flowing narration only`,
      },
      {
        role: "user",
        content: JSON.stringify({ summary, insights, supportNote }, null, 2),
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? summary.slice(0, 800);
}

function mapThreadItems(
  items: z.infer<typeof ThreadItemSchema>[],
  idPrefix: string
): WorryThread[] {
  return items.map((t, i) => ({
    id: `${idPrefix}-${i}`,
    title: t.title,
    summary: t.summary,
    intensity: t.intensity,
    trend: t.trend,
    mentionCount: t.mentionCount,
    firstSeen: t.firstSeen,
    lastSeen: t.lastSeen,
    focusPriority: t.focusPriority,
    suggestedActions: t.suggestedActions,
    relatedDates: t.relatedDates,
  }));
}

export async function generateMindThreads(
  entries: {
    date: string;
    summary: string;
    mood: number | null;
    themes: string[];
    openThread?: string | null;
  }[]
): Promise<{
  threads: WorryThread[];
  focusRecommendation: string;
  brightThreads: BrightThread[];
  celebrateRecommendation: string;
}> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Analyze voice journal entries and extract two kinds of ongoing mental threads.

1) WORRY THREADS — recurring preoccupations (work stress, relationship tension, health anxiety, etc.)
2) BRIGHT THREADS — recurring sources of energy, joy, gratitude, progress, or connection (friendships, creative flow, fitness wins, small daily pleasures, etc.)

Return JSON:
- focusRecommendation: 2-3 sentences on which 1-2 worry threads deserve focus THIS week and why
- celebrateRecommendation: 2-3 sentences on which 1-2 bright threads to notice and lean into this week
- worryThreads: 3-6 items (empty array if none)
- brightThreads: 2-5 items (empty array if the week had no clear positives — do not invent wins)

Each thread item:
- title: short label (3-5 words)
- summary: what's going on (2-3 sentences)
- intensity: 0-10 mental space (worries) or positive energy (bright threads)
- trend: rising | stable | fading
- mentionCount: estimated times it appeared
- firstSeen, lastSeen: YYYY-MM-DD from entries
- focusPriority: 1 (highest) to 5
- suggestedActions: 2-3 concrete, kind steps (worries: gentle actions; bright: ways to savor or keep going)
- relatedDates: dates it showed up

Do not list the same topic in both lists unless the framing is genuinely different.`,
      },
      { role: "user", content: JSON.stringify(entries, null, 2) },
    ],
  });

  const parsed = MindThreadsSchema.parse(JSON.parse(response.choices[0]?.message?.content ?? "{}"));

  return {
    threads: mapThreadItems(parsed.worryThreads, "thread"),
    focusRecommendation: parsed.focusRecommendation,
    brightThreads: mapThreadItems(parsed.brightThreads, "bright"),
    celebrateRecommendation: parsed.celebrateRecommendation,
  };
}

/** @deprecated Use generateMindThreads */
export async function generateWorryThreads(
  entries: Parameters<typeof generateMindThreads>[0]
): Promise<{ threads: WorryThread[]; focusRecommendation: string }> {
  const result = await generateMindThreads(entries);
  return { threads: result.threads, focusRecommendation: result.focusRecommendation };
}

export async function generateMemoirScript(
  year: number,
  entries: { date: string; summary: string; mood: number | null; themes: string[] }[]
): Promise<string> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Write a narrated audio memoir script for ${year}. 
Structure: opening hook, seasonal chapters, emotional peaks, growth arc, closing reflection.
Tone: intimate, cinematic, second person. 
Length: ~800-1200 words (5-8 min spoken).
Do NOT include stage directions or [music] tags — pure narration text only.`,
      },
      { role: "user", content: JSON.stringify(entries, null, 2) },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
