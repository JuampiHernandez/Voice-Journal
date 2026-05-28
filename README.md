# Voice Journal

**Daily 3-minute voice check-ins that become your yearly memoir.**

Built for [#ElevenHacks](https://elevenlabs.io) with **ElevenLabs Speech Engine** for local voice check-ins and **Eleven Music API** for the year-end score.

Production is intentionally demo-only for voice. The deployed app shows dashboards, insights, threads, memoir, and local setup instructions. Live voice check-ins run on **localhost + ngrok**.

## Quick Start: Local Voice

Install ngrok and authenticate it once:

```bash
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

Clone and install:

```bash
git clone https://github.com/JuampiHernandez/Voice-Journal.git
cd Voice-Journal
npm install
cp .env.example .env
```

Fill `.env`:

```bash
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ALLOW_GUEST_JOURNAL=true
```

First time only, create/sync the Speech Engine:

```bash
ngrok http 3002

# In a second terminal:
npm run setup:speech-engine
```

After that, run everything with:

```bash
npm run dev:full
```

Open:

```bash
http://localhost:3001/journal?user=YourName
```

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
       │                                      │
       └── Supabase data ◄── Speech Engine server (:3002)
                               │
                               └── OpenAI agent + analysis
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
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side DB key |
| `SPEECH_ENGINE_ID` | Local voice | Written by `npm run setup:speech-engine` |
| `SPEECH_ENGINE_WS_URL` | Local voice | Written by `npm run setup:speech-engine` from ngrok |
| `ALLOW_GUEST_JOURNAL` | Demo | `true` lets you use `?user=Name` without email |
| `ELEVENLABS_VOICE_ID` | Optional | Narrator voice for generated audio |

## Demo Video

```bash
npm run prep:demo-video
```

See [docs/HACKATHON_DEMO_VIDEO.md](docs/HACKATHON_DEMO_VIDEO.md).

## License

MIT — hackathon submission for ElevenHacks.
