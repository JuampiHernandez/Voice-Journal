# Deploy Voice Journal

Production is now intentionally simple:

| Surface | Host | What works |
|---------|------|------------|
| Web app | Vercel | Home, auth, dashboard, threads, insights, memoir, demo data |
| Voice check-in | Localhost + ngrok | Live ElevenLabs Speech Engine sessions |
| Data | Supabase | Postgres, auth, private audio storage |

The live voice check-in is not supported on production. The `/journal` page on Vercel shows a local setup guide instead.

## Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/20260527000000_voice_journal.sql` in the SQL editor.
3. Create a private Storage bucket named `journal-audio`.
4. Enable email magic links in Authentication.
5. Copy these values into `.env` locally and Vercel env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Vercel

Vercel hosts the non-voice parts of the app.

```bash
npm i -g vercel
vercel link
vercel env add ELEVENLABS_API_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ALLOW_GUEST_JOURNAL
vercel deploy --prod
```

Set `ALLOW_GUEST_JOURNAL=true` for demos.

In Supabase Authentication URL configuration:

- Site URL: `https://your-app.vercel.app`
- Redirect URL: `https://your-app.vercel.app/auth/callback`

## Local Voice Setup

First install ngrok and authenticate it once:

```bash
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

Then set up the app:

```bash
git clone https://github.com/JuampiHernandez/Voice-Journal.git
cd Voice-Journal
npm install
cp .env.example .env
```

Fill `.env` with:

```bash
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ALLOW_GUEST_JOURNAL=true
```

Create/sync the ElevenLabs Speech Engine once:

```bash
ngrok http 3002

# In a second terminal:
npm run setup:speech-engine
```

The setup script detects ngrok and writes `SPEECH_ENGINE_ID` and `SPEECH_ENGINE_WS_URL` into `.env`.

After that, use one command:

```bash
npm run dev:full
```

Open:

```bash
http://localhost:3001/journal?user=YourName
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `/journal` shows setup instructions | You are on production. Open `http://localhost:3001/journal` instead. |
| Missing `SPEECH_ENGINE_WS_URL` | Run `ngrok http 3002`, then `npm run setup:speech-engine`. |
| Speech Engine unreachable | Restart `npm run dev:full` and confirm ngrok is online. |
| ElevenLabs cannot reach WebSocket | Re-run `npm run setup:speech-engine` while ngrok is running. |
| Transcript saves to wrong user | Use `?user=YourName` locally or sign in with magic link. |
