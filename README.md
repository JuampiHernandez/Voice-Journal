# Voice Journal

**Daily 3-minute voice check-ins that become your yearly memoir.**

Built for [#ElevenHacks](https://elevenlabs.io) with **ElevenLabs Speech Engine** for local voice check-ins and **Eleven Music API** for the year-end score.

Production is intentionally demo-only for voice. The deployed app shows dashboards, insights, threads, memoir, and local setup instructions. Live voice check-ins run on **localhost + ngrok**.

Journal data is stored in **SQLite** at `data/voice-journal.db` (gitignored). A fresh clone or fork starts with an **empty** database — your entries are never committed to git.

## Quick Start: Local Voice

**Full command list:** [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

```bash
git clone https://github.com/JuampiHernandez/Voice-Journal.git
cd Voice-Journal
npm install
cp .env.example .env
# Edit .env: ELEVENLABS_API_KEY, OPENAI_API_KEY

# Terminal A (first time only, keep running):
ngrok http 3002

# Terminal B (first time only):
npm run setup:speech-engine

# Every day:
npm run dev:full
# → http://localhost:3001/journal?user=YourName
```

Use `?user=YourName` so each person on the same machine gets a separate journal (stored in this browser’s `localStorage`). The database file `data/voice-journal.db` is gitignored — forks start empty.

**Optional:** copy an existing Supabase project once with `npm run migrate:supabase` (see [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)).

## Production

Deploy the Next.js app to Vercel for the non-voice demo:

- `/` landing page with copyable local setup
- `/dashboard` insights and demo seed
- `/threads` worry/bright thread maps
- `/memoir` generated memoir
- `/journal` local setup instructions only

See [docs/DEPLOY.md](docs/DEPLOY.md).

## Architecture

```text
Browser on localhost ── ElevenLabs client ── ElevenLabs STT/TTS
       │                                      │
       │                                      ▼
       ├── Next.js app (:3001)          ngrok public URL
       │         │                            │
       │         └── SQLite (data/)           ▼
       └── Speech Engine server (:3002) ◄── OpenAI agent + analysis
```

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing + local setup guide |
| `/journal` | Local-only 3-minute Speech Engine check-in |
| `/dashboard` | Streak, weekly insights, emotional timeline |
| `/threads` | Worry and bright-thread maps |
| `/memoir` | Year-end narrated memoir + music |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `OPENAI_API_KEY` | Yes | LLM for agent, analysis, memoir script |
| `SPEECH_ENGINE_ID` | Local voice | Written by `npm run setup:speech-engine` |
| `SPEECH_ENGINE_WS_URL` | Local voice | Written by `npm run setup:speech-engine` from ngrok |
| `DEFAULT_USER_ID` | Optional | Fallback when no `?user=` (default `demo-user`) |
| `ELEVENLABS_VOICE_ID` | Optional | Narrator voice for generated audio |

## Demo Video

```bash
npm run prep:demo-video
```

See [docs/HACKATHON_DEMO_VIDEO.md](docs/HACKATHON_DEMO_VIDEO.md).

## License

MIT — hackathon submission for ElevenHacks.
