/**
 * Seed clearly fictional demo journal entries without overwriting existing days.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-narrative.ts [userId]           # skip dates that already have entries
 *   npx tsx scripts/seed-demo-narrative.ts [userId] --replace # overwrite existing dates
 */
import "dotenv/config";
import { ensureUser, getEntryForDate, saveJournalEntry } from "../src/lib/memory";
import { analyzeTranscript } from "../src/lib/analysis";

const ENTRIES: { date: string; transcript: string }[] = [
  {
    date: "2026-05-16",
    transcript:
      "Fictional demo entry: Jordan started the week feeling squeezed by deadlines at a small design studio. A short walk after lunch helped the pressure soften a little.",
  },
  {
    date: "2026-05-17",
    transcript:
      "Fictional demo entry: A slow Sunday reset. Jordan made breakfast, tidied the apartment, and noticed how much calmer the day felt with no notifications for an hour.",
  },
  {
    date: "2026-05-18",
    transcript:
      "Fictional demo entry: Jordan returned to a simple health routine: groceries, a gym session, and an early night. Structure felt like an anchor.",
  },
  {
    date: "2026-05-19",
    transcript:
      "Fictional demo entry: A promising coffee chat with someone new left Jordan excited and a little nervous. The connection felt easy, but expectations stayed intentionally light.",
  },
  {
    date: "2026-05-20",
    transcript:
      "Fictional demo entry: Work uncertainty showed up again today. Jordan sent a careful follow-up email, then closed the laptop before dinner to avoid spiraling.",
  },
  {
    date: "2026-05-21",
    transcript:
      "Fictional demo entry: Dinner with friends helped. There was laughter, a shared dessert, and the rare feeling of being fully present for a couple of hours.",
  },
  {
    date: "2026-05-22",
    transcript:
      "Fictional demo entry: Jordan planned a short conference trip for later in the month. The logistics were messy, but the possibility of new ideas felt energizing.",
  },
  {
    date: "2026-05-23",
    transcript:
      "Fictional demo entry: A long phone call with an old friend brought up both gratitude and loneliness. Jordan noticed both feelings could exist at once.",
  },
  {
    date: "2026-05-24",
    transcript:
      "Fictional demo entry: A presentation practice session went better than expected. Jordan still felt anxious afterward, but the anxiety no longer felt like proof of failure.",
  },
  {
    date: "2026-05-25",
    transcript:
      "Fictional demo entry: Travel planning and project notes filled the afternoon. Jordan skipped a workout, noticed the dip in mood, and decided to restart gently tomorrow.",
  },
  {
    date: "2026-05-26",
    transcript:
      "Fictional demo entry: A quiet evening before a busy week. Jordan packed a bag, wrote down three intentions, and felt both nervous and hopeful.",
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

  ensureUser(userId);
  console.log(`Seeding fictional demo narrative for user: ${userId}`);
  console.log(replace ? "Mode: replace existing dates\n" : "Mode: skip existing dates\n");

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const { date, transcript } of ENTRIES) {
    const existing = getEntryForDate(userId, date);

    if (existing && !replace) {
      console.log(`  - ${date} skipped; entry already exists`);
      skipped++;
      continue;
    }

    const analysis = await analyzeTranscript(transcript);

    saveJournalEntry({
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
        `  ~ ${date} replaced; mood ${analysis.mood.toFixed(1)}; ${analysis.themes.slice(0, 3).join(", ")}`
      );
      updated++;
    } else {
      console.log(
        `  + ${date} created; mood ${analysis.mood.toFixed(1)}; ${analysis.themes.slice(0, 3).join(", ")}`
      );
      created++;
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${updated} replaced.`);
  console.log("Timeline: May 16-26 seeded with fictional demo journal entries.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
