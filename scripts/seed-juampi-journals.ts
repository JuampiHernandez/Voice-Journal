/**
 * Seed personalized journal entries without overwriting existing days.
 *
 * Usage:
 *   npx tsx scripts/seed-juampi-journals.ts [userId]           # skip dates that already have entries
 *   npx tsx scripts/seed-juampi-journals.ts [userId] --replace # overwrite existing dates
 *
 * Backfill is May 16–26 (11 days). Your real entries on May 27–29 are left alone by default.
 */
import "dotenv/config";
import { ensureUser, getEntryForDate, saveJournalEntry } from "../src/lib/memory";
import { analyzeTranscript } from "../src/lib/analysis";

/** Days before the user's existing May 27–29 voice entries */
const ENTRIES: { date: string; transcript: string }[] = [
  {
    date: "2026-05-16",
    transcript:
      "Rough start to the week. Still unemployed and sending applications into the void — mostly tech roles, some crypto, some EIA stuff. I know I'm qualified but the silence after interviews is brutal. At least I got a workout in this morning; legs are sore but it cleared my head a little.",
  },
  {
    date: "2026-05-17",
    transcript:
      "Slow Sunday at home with my family in Rosario. My mom made lunch for everyone and we just hung out — I forget how much I need that when I'm stuck in my head about work. I love living with them even when it feels cramped. Grateful day, mood maybe a 7.",
  },
  {
    date: "2026-05-18",
    transcript:
      "Back on the health routine hard today. Meal prepped chicken and veggies, hit the gym, drank enough water. When I don't have a job, structure is the only thing keeping me sane. Food and training are the two things I can control right now.",
  },
  {
    date: "2026-05-19",
    transcript:
      "Met someone I really like — she's from Buenos Aires, I'm here in Rosario, so already it's complicated. We had this easy conversation like we'd known each other for years. I'm excited but also thinking, long distance, I'm broke, I don't even have an office to commute to. Still, I can't stop smiling.",
  },
  {
    date: "2026-05-20",
    transcript:
      "Another day of job hunting. Tweaked my CV for a crypto protocol role and a climate-tech startup in the EIA space. Sent follow-ups on two applications from last week — nothing back. The uncertainty is the worst part. Family was supportive at dinner; dad said the right job will show up.",
  },
  {
    date: "2026-05-21",
    transcript:
      "Went out for a proper meal with friends — good steak, good wine, laughed for the first time in days. I love food way too much to eat sad desk lunches every day even when I'm not working. Came home and texted her goodnight. Small things.",
  },
  {
    date: "2026-05-22",
    transcript:
      "Big planning day. Flights to New York are booked for tech week and ETHConf — I'm nervous and pumped at the same time. This could be networking gold while I'm between jobs. Also mapped out the SF leg after NY. Lots of moving pieces but it feels real now.",
  },
  {
    date: "2026-05-23",
    transcript:
      "Long video call with her last night. Distance between Rosario and Buenos Aires is only a few hours but emotionally it feels bigger. We talked about what we'd do if we met again in person. I feel seen. Also a little scared I'm building this up too much in my head.",
  },
  {
    date: "2026-05-24",
    transcript:
      "Had a technical interview for a backend role — went better than expected. They liked my side projects. Now the waiting game again. Did a long run to burn off the adrenaline. If I land something before NY I'd feel so much lighter on the trip.",
  },
  {
    date: "2026-05-25",
    transcript:
      "SF logistics today — where to stay, who to meet, how long between ETHConf and the Bay Area meetings I lined up on LinkedIn. Networking while unemployed feels awkward but I need to show up. Skipped the gym and regretted it; tomorrow I'm back on track.",
  },
  {
    date: "2026-05-26",
    transcript:
      "Last quiet night with family before travel. My sister helped me figure out what to pack; mom worried I'll forget to eat. I love them so much — leaving home even for a cool trip hits different when they're your base. Feeling bittersweet, mood around a 6.",
  },
];

async function main() {
  const args = process.argv.slice(2);
  const replace = args.includes("--replace");
  const userId = args.find((a) => a !== "--replace") ?? "demo-user";

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY required in .env");
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase env vars required in .env");
    process.exit(1);
  }

  await ensureUser(userId);
  console.log(`Seeding for user: ${userId}`);
  console.log(replace ? "Mode: replace existing dates\n" : "Mode: skip existing dates (your May 27–29 stay intact)\n");

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const { date, transcript } of ENTRIES) {
    const existing = await getEntryForDate(userId, date);

    if (existing && !replace) {
      console.log(`  ⊘ ${date} skipped — entry already exists`);
      skipped++;
      continue;
    }

    const analysis = await analyzeTranscript(transcript);

    await saveJournalEntry({
      userId,
      entryDate: date,
      entryId: existing?.id,
      transcript,
      summary: analysis.summary,
      mood: analysis.mood,
      themes: analysis.themes,
      durationSeconds: 165 + Math.floor(Math.random() * 60),
      emotionalMoments: analysis.emotionalMoments,
      openThread: analysis.openThread,
      microAction: analysis.microAction,
    });

    if (existing) {
      console.log(
        `  ↻ ${date} replaced — mood ${analysis.mood.toFixed(1)} · ${analysis.themes.slice(0, 3).join(", ")}`
      );
      updated++;
    } else {
      console.log(
        `  ✓ ${date} created — mood ${analysis.mood.toFixed(1)} · ${analysis.themes.slice(0, 3).join(", ")}`
      );
      created++;
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${updated} replaced.`);
  console.log(`Timeline: May 16–26 (seeded) + May 27–29 (your voice entries) = 14 days.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
