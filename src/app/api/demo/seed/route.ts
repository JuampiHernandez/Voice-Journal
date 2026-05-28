import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { saveJournalEntry } from "@/lib/memory";
import { getAppConfig } from "@/lib/config";
import { analyzeTranscript } from "@/lib/analysis";
import { withJournalUser } from "@/lib/auth/api-context";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { userId?: string };
  const ctx = await withJournalUser(request, body.userId);
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = ctx;

  const config = getAppConfig();
  if (!config.openaiReady) {
    return NextResponse.json({ error: "OPENAI_API_KEY required" }, { status: 503 });
  }

  const samples = [
    {
      daysAgo: 6,
      transcript:
        "Work was overwhelming today. I had three deadlines and felt like I couldn't breathe. But I did a walk at lunch and it helped a little.",
    },
    {
      daysAgo: 5,
      transcript:
        "The presentation went better than expected. My manager said I nailed it. Still anxious underneath but I'm proud.",
    },
    {
      daysAgo: 4,
      transcript:
        "Quiet day. Grateful for small things — good coffee, sunshine through the window.",
    },
    {
      daysAgo: 3,
      transcript:
        "Had a hard conversation with my partner. I cried in the shower afterward. Not a bad cry — a release cry.",
    },
    {
      daysAgo: 2,
      transcript: "Feeling lighter. Started sketching ideas for the side project. Mood is a 7 today.",
    },
    {
      daysAgo: 1,
      transcript:
        "Sunday reset. Noticed I've been journaling more consistently and it helps me see patterns in my anxiety.",
    },
    {
      daysAgo: 0,
      transcript:
        "New week energy. Set three intentions: one for work, one for health, one for relationships.",
    },
  ];

  const results = [];
  for (const sample of samples) {
    const date = format(new Date(Date.now() - sample.daysAgo * 86400000), "yyyy-MM-dd");
    const analysis = await analyzeTranscript(sample.transcript);
    await saveJournalEntry({
      userId,
      entryDate: date,
      transcript: sample.transcript,
      summary: analysis.summary,
      mood: analysis.mood,
      themes: analysis.themes,
      durationSeconds: 180,
      emotionalMoments: analysis.emotionalMoments,
    });
    results.push({ date, mood: analysis.mood, themes: analysis.themes });
  }

  return NextResponse.json({ seeded: results.length, entries: results });
}
