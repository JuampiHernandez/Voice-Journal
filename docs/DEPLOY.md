# Deploy Voice Journal

| Surface | Host | What works |
|---------|------|------------|
| Web app | Vercel | Home, dashboard, threads, insights, memoir (demo shell) |
| Voice check-in | Localhost + ngrok | Live ElevenLabs Speech Engine sessions |
| Data | Local SQLite | `data/voice-journal.db` (gitignored; empty on every fresh fork) |

The live voice check-in is not supported on production. The `/journal` page on Vercel shows a local setup guide instead.

## Vercel

Vercel hosts the non-voice parts of the app. Each deployment uses its own ephemeral filesystem unless you attach external storage — for hackathon demos, use local SQLite on your machine for real data.

```bash
npm i -g vercel
vercel link
vercel env add ELEVENLABS_API_KEY
vercel env add OPENAI_API_KEY
vercel deploy --prod
```

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

## Optional: migrate existing Supabase data

If you still have journal rows in Supabase, run once locally (does not delete the cloud project):

```bash
npm run migrate:supabase
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `/journal` shows setup instructions | You are on production. Open `http://localhost:3001/journal` instead. |
| Missing `SPEECH_ENGINE_WS_URL` | Run `ngrok http 3002`, then `npm run setup:speech-engine`. |
| Speech Engine unreachable | Restart `npm run dev:full` and confirm ngrok is online. |
| ElevenLabs cannot reach WebSocket | Re-run `npm run setup:speech-engine` while ngrok is running. |
| Transcript saves to wrong user | Add `?user=YourName` to the URL (stored in this browser's localStorage). |
| Fork has someone else's journals | `data/` is gitignored — delete `data/` and restart, or use a new `?user=` name. |
