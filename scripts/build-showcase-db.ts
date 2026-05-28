/**
 * Build the pre-seeded SQLite file shipped with Vercel deployments.
 *
 * Usage: npx tsx scripts/build-showcase-db.ts
 */
import fs from "node:fs";
import path from "node:path";

const outPath = path.join(process.cwd(), "data", "showcase.db");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
for (const file of [outPath, `${outPath}-wal`, `${outPath}-shm`]) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

process.env.JOURNAL_DB_PATH = outPath;

async function main() {
  const { ensureAllShowcasesSeeded } = await import("../src/lib/showcase-seed");
  ensureAllShowcasesSeeded();
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
