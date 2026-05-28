# Deploy Voice Journal (Vercel + Supabase + Railway)

Production split:

| Service | Host | Role |
|---------|------|------|
| Next.js UI + API | **Vercel** | Dashboard, auth, memoir, conversation tokens |
| Speech Engine WS | **Railway** | Long-lived WebSocket + your OpenAI agent logic |
| Database + auth | **Supabase** | Postgres, magic link, audio storage |

---

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → run `supabase/migrations/20260527000000_voice_journal.sql`.
3. **Storage** → New bucket `journal-audio` (private), or run `node scripts/setup-supabase-storage.mjs`.
4. **Authentication** → Email → enable Magic Link.
5. **Project Settings → API** → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only)

---

## 2. Railway — Speech Engine

The voice WebSocket server cannot run on Vercel. Deploy it to Railway from this repo.

### Option A — Dashboard (no CLI)

1. [railway.com/new](https://railway.com/new) → **Deploy from GitHub** → select this repo.
2. **Settings → Build** → Dockerfile path: `Dockerfile.speech-engine`
3. **Settings → Deploy** → health check path: `/health`
4. **Variables** (same values as local `.env`):

   | Variable | Required |
   |----------|----------|
   | `ELEVENLABS_API_KEY` | Yes |
   | `OPENAI_API_KEY` | Yes |
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes |
   | `SPEECH_ENGINE_ID` | After setup step below |
   | `SPEECH_ENGINE_WS_URL` | After domain step below |

5. **Networking → Generate domain** → copy e.g. `voice-journal-production.up.railway.app`
6. Set `SPEECH_ENGINE_WS_URL=wss://YOUR-DOMAIN.up.railway.app/ws` on Railway.
7. **Redeploy** so startup syncs the URL with ElevenLabs.

### Option B — CLI

```bash
npm i -g @railway/cli
railway login
railway init          # link repo, create service
npm run deploy:railway
```

Then add variables in the Railway dashboard (or `railway variables set …`).

### Register Speech Engine with ElevenLabs (one time)

After Railway domain is live:

```bash
SPEECH_ENGINE_WS_URL=wss://YOUR-DOMAIN.up.railway.app/ws npm run setup:production
```

Copy the printed `SPEECH_ENGINE_ID` and `SPEECH_ENGINE_WS_URL` into **Railway** and **Vercel** env vars.

Verify health: `curl https://YOUR-DOMAIN.up.railway.app/health` → `{"ok":true}`

On each deploy, the Speech Engine server auto-syncs its `wsUrl` with ElevenLabs when `RAILWAY_PUBLIC_DOMAIN` or `SPEECH_ENGINE_WS_URL` is set.

---

## 3. Vercel — Next.js app

```bash
npm i -g vercel
vercel link
vercel env add ELEVENLABS_API_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SPEECH_ENGINE_ID
vercel env add SPEECH_ENGINE_WS_URL
vercel env add ALLOW_GUEST_JOURNAL   # value: true for hackathon judges
vercel deploy --prod
```

In Supabase **Authentication → URL configuration**:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

**Without Speech Engine on Railway:** judges can still use Insights, Threads, demo seed, and Memoir — only live voice check-in is disabled.

---

## 4. Judge quick test

| Path | Steps |
|------|--------|
| **Guest** | `https://your-app.vercel.app/dashboard?user=JudgeName` → Load demo week |
| **Voice** | `/journal` → Start check-in (needs Railway Speech Engine + env vars on Vercel) |
| **Account** | Nav → Sign in → magic link → Check-in with voice |

---

## 5. Local dev (same Supabase)

```bash
npm install
cp .env.example .env
# Fill keys; ALLOW_GUEST_JOURNAL=true for ?user= demos

npm run dev              # Terminal 1 — Next.js on :3001
npm run dev:voice        # Terminal 2 — ngrok + speech-engine on :3002
npm run setup:speech-engine   # first time only
```

Data lives in Supabase whether you use localhost, Railway, or Vercel.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Voice check-in 503 | Set `SPEECH_ENGINE_ID` + `SPEECH_ENGINE_WS_URL` on Vercel |
| "Speech Engine not configured" | Run `npm run setup:production` with Railway URL |
| Health check fails on Railway | Ensure Dockerfile path is `Dockerfile.speech-engine`, not default Next.js |
| Transcript saves to wrong user | Both Vercel and Railway need same Supabase keys (session queue is in DB) |
| ElevenLabs can't reach WS | Confirm `curl https://YOUR-DOMAIN/health` works; re-run `npm run sync:speech-engine` |
