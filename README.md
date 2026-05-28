# Voice Journal

**Daily 3-min voice check-ins that become your yearly memoir.**

Built for [#ElevenHacks](https://elevenlabs.io) — showcasing **ElevenLabs Speech Engine** (your LLM + memory) and **Eleven Music API** (year-end score).

> *"I voice-journaled every day for a month. Here's what the AI noticed."*

---

## Hackathon fit

| Requirement | How Voice Journal delivers |
|-------------|---------------------------|
| **Speech Engine** | Custom server WebSocket + your OpenAI logic; ElevenLabs handles STT/TTS/turn-taking |
| **Creative voice agent** | Memory-aware daily companion that references yesterday, last week, emotional moments |
| **Viral hook** | Weekly "what the AI noticed" insights + TikTok-ready emotional timeline |
| **Eleven Music** | Year-end narrated memoir with generated ambient score |
| **Privacy story** | All journal data in **your SQLite DB** — not ElevenAgents cloud memory |

### Why Speech Engine over ElevenAgents?

**ElevenAgents** excels at managed, low-latency voice agents with dashboard tools and telephony — but **long-running personalized memory** (365 days of transcripts, mood analysis, emotional timelines) belongs on **your infrastructure**.

**Speech Engine** is the ideal split:
- ElevenLabs → voice layer (STT, TTS, interruptions, WebRTC)
- Your server → LLM prompts, memory retrieval, analysis, memoir generation

---

## Architecture

```
Browser (Next.js)                    Your server                         ElevenLabs
─────────────────                    ───────────                         ──────────
Check-in UI ──WebRTC──► Conversation token API
                              │
VoiceJournalSession           ├── Speech Engine WS (/ws) ◄──── STT/TTS pipeline
                              │        │
                              │        └── onTranscript → OpenAI + memory context
                              │
                              ├── SQLite (entries, moods, moments)
                              ├── Weekly summary (OpenAI)
                              └── Memoir (OpenAI script + TTS + Eleven Music)
```

---

## Quick start

### 1. Install

```bash
npm install
cp .env.example .env
# Add ELEVENLABS_API_KEY and OPENAI_API_KEY
```

### 2. Expose Speech Engine (required for live voice)

Speech Engine needs a **public WebSocket URL**. Use [ngrok](https://ngrok.com):

```bash
# Terminal 1 — start Speech Engine server
npm run speech-engine

# Terminal 2 — expose port 3001
ngrok http 3001
```

Copy the ngrok `wss://…` URL into `.env`:

```env
SPEECH_ENGINE_WS_URL=wss://YOUR-ID.ngrok-free.app/ws
```

### 3. Register Speech Engine (one-time)

```bash
npm run setup:speech-engine
# Copy SPEECH_ENGINE_ID into .env
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

### 5. Demo without live voice

For the hackathon video, seed a week of sample entries:

1. Go to **Insights** → **Load demo week**
2. View weekly AI insights and emotional timeline
3. Go to **Memoir** → **Generate my memoir** (uses TTS + Eleven Music)

### 6. Deploy for judges (Vercel + Supabase + Railway)

See **[docs/DEPLOY.md](docs/DEPLOY.md)** — Vercel for the app, **Railway for Speech Engine**, Supabase for auth/data, and `?user=JudgeName` guest mode.

```bash
# After Railway domain is live:
SPEECH_ENGINE_WS_URL=wss://YOUR-DOMAIN.up.railway.app/ws npm run setup:production
npm run deploy:railway   # or deploy via Railway dashboard (Dockerfile.speech-engine)
```

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing + hackathon pitch |
| `/journal` | 3-minute Speech Engine check-in |
| `/dashboard` | Streak, weekly insights, emotional timeline |
| `/memoir` | Year-end narrated memoir + music |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `OPENAI_API_KEY` | Yes | LLM for agent, analysis, memoir script |
| `SPEECH_ENGINE_ID` | For voice | From `npm run setup:speech-engine` |
| `SPEECH_ENGINE_WS_URL` | For voice | Public `wss://…/ws` URL (ngrok or Railway) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side DB (never expose to browser) |
| `ALLOW_GUEST_JOURNAL` | Demo | `true` lets judges use `?user=Name` without email |
| `ELEVENLABS_VOICE_ID` | No | Narrator voice (default: George) |

---

## Demo video (hackathon submission)

Full shot list, captions, TikTok cut, and prep script:

```bash
npm run prep:demo-video   # seed data + voice stack + memoir
```

See **[docs/HACKATHON_DEMO_VIDEO.md](docs/HACKATHON_DEMO_VIDEO.md)** for the 60–75s judge cut and 25–30s viral cut.

---

## Tech stack

- **Next.js 16** — App Router UI + API routes
- **@elevenlabs/elevenlabs-js** — Speech Engine server, TTS, Music API
- **@elevenlabs/client** — Browser WebRTC conversation
- **OpenAI** — Agent logic, transcript analysis, memoir script
- **Supabase Postgres** — Journal memory + auth (magic link)
- **Supabase Storage** — Weekly voice recaps & memoir audio

---

## License

MIT — hackathon submission for ElevenHacks.
