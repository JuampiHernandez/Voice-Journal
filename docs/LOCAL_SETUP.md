# Local setup — exact commands

Run these from the project root (`Voice-Journal/`).

## 1. First time on this machine

```bash
npm install
cp .env.example .env
```

Edit `.env` and set at least:

- `ELEVENLABS_API_KEY`
- `OPENAI_API_KEY`

## 2. (Optional) Copy old Supabase data into SQLite

Only if you still have a Supabase project with journal rows. Skip this on a fresh fork.

Add to `.env` temporarily:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Then:

```bash
npm run migrate:supabase
```

Re-run and overwrite local rows:

```bash
npm run migrate:supabase -- --force
```

When done, remove the two Supabase lines from `.env`.

## 3. First time: register Speech Engine with ElevenLabs

Terminal A — leave running:

```bash
ngrok http 3002
```

Terminal B:

```bash
npm run setup:speech-engine
```

Writes `SPEECH_ENGINE_ID` and `SPEECH_ENGINE_WS_URL` into `.env`.

## 4. Every day: run the app + voice

One command (starts ngrok, speech engine, Next.js):

```bash
npm run dev:full
```

Open in the browser:

```text
http://localhost:3001/journal
```

Each browser gets its own journal id automatically. Optional: `?user=YourName` for a readable name or a second journal on the same machine.

Other useful commands:

| Command | What it does |
|---------|----------------|
| `npm run dev` | Next.js only (no voice) |
| `npm run speech-engine` | Speech Engine server only |
| `npm run sync:speech-engine` | Re-sync ngrok URL to ElevenLabs |
| `npm run seed:demo-narrative` | Seed fictional demo journal text (needs `OPENAI_API_KEY`) |
| `npm run prep:demo-video` | Demo data + optional voice stack for recording |

Database file (created automatically, not in git): `data/voice-journal.db`
