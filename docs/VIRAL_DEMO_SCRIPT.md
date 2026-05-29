# Voice Journal — viral demo script & full feature guide

**Hackathon:** [ElevenHacks #10](https://hacks.elevenlabs.io/hackathons/9) · **Guide:** [hacks.elevenlabs.io/guide](https://hacks.elevenlabs.io/guide)

**The hook:**

> **“I built myself an AI psychologist to listen to me.”**

**One-line pitch:**

> Three minutes of voice a day becomes a private AI that remembers your year, gives you tips, and turns it all into a narrated memoir with music.

---

## Why this hook works (and how we keep it honest)

| Why it spreads | How we stay safe |
|----------------|------------------|
| Confessional, scroll-stopping, instantly relatable | Within 5 seconds, on-screen text reframes it: **“not a therapist — a voice companion that remembers me”** |
| Sets up the wow: the AI **remembers + helps** | Live moment proves it (it brings up last week, suggests one small step) |
| Hooks both judges (Speech Engine + memory) and casual viewers (emotional arc) | Tech reveal at the end: **Speech Engine = voice · your server = brain + memory** |

**Emotional spine:** lonely confession → AI listens → AI **remembers** → AI gives me a tip → year-end payoff.

---

## Prep (15 minutes before you hit Record)

### One command to load demo data + voice stack

```bash
# Terminal 1 — app
npm run dev

# Terminal 2 — seed week, weekly recap, memoir, optional voice stack
npm run prep:demo-video
# same as: ./scripts/prep-demo-video.sh --voice-stack --with-memoir
```

Then in the browser console (Incognito is fine):

```js
localStorage.setItem('voice-journal-user-id', 'demo-video');
location.reload();
```

### Tabs to open (in order)

1. `http://localhost:3001/` — landing
2. `http://localhost:3001/journal` — live voice (localhost only)
3. `http://localhost:3001/dashboard` — insights
4. `http://localhost:3001/threads` — worry + bright threads
5. `http://localhost:3001/memoir` — year-end audio

### Recording checklist

- [ ] Mic on, notifications off, bookmarks bar hidden
- [ ] Browser zoom 100%, dark theme
- [ ] **Do not** show ngrok URLs, terminal, API keys, or `?debug` on `/journal`
- [ ] Headphones **off** so viewers hear the agent
- [ ] Memoir page already has **Play** ready (don’t generate on camera)
- [ ] Practice the live voice line once — agent should reference a past entry

**If voice fails:** record dashboard + threads + memoir only; VO: *“Live demo uses Speech Engine — full repo in description.”*

---

## The script — step by step

Format: every step has **what you SAY** and **what you SHOW**. Do it in order, one continuous take if you can. Total runtime ~75 seconds for the judge cut.

Use **bold lines as on-screen captions** (large, bottom third). Italic lines are spoken or voiceover.

---

### Step 1 — The hook (0:00–0:04)

**SAY:** *“I built myself an AI psychologist to listen to me.”*

**SHOW:**
- Your face cam, OR a blurred dashboard pulling into focus on **“What the AI noticed this week.”**
- Caption: **I built myself an AI psychologist to listen to me.**

**Why:** Confessional + funny. Stops the scroll. The product reframes itself in 5 seconds, so the line stays safe.

---

### Step 2 — Reframe (0:04–0:08)

**SAY:** *“Okay — not really a therapist. A 3-minute voice companion that actually remembers me.”*

**SHOW:**
- Landing page `/` — slow scroll past the hero.
- Caption: **3 minutes a day. It remembers everything.**

**Why:** Disarms the “AI psychologist” claim, anchors the real product, sets up the wow.

---

### Step 3 — Start the live check-in (0:08–0:14)

**SAY:** *(nothing yet — let the agent greet you)*

**SHOW:**
- Click into `/journal`, tap **Start check-in**.
- Timer ring fills with amber. Voice wave starts moving.
- Caption: **Live · ElevenLabs Speech Engine**

---

### Step 4 — Vent + ask for help (0:14–0:24)

**SAY (this exact vibe, ~12 seconds):**

> *“Hey — I’m still stressed about accommodation for New York and San Francisco. It’s been sitting in my head all week. **What’s one small thing I could actually do about it tomorrow?**”*

**SHOW:**
- Just the live `/journal` page — timer running, voice wave reacting.
- Caption: **I told it my problem.**

**Why:** That last question is the trigger that makes the agent give a **tip**, not just listen.

---

### Step 5 — The “it remembered” beat (0:24–0:30)

**SAY:** *(silent — let the agent answer)*

**SHOW:**
- Agent speaks. It should reference **last week / yesterday / a recurring theme** (because of the seeded demo data).
- The instant it does, freeze for **1 full second**.
- Caption: **It remembered.**

**Why:** This is the wow. Don’t step on it.

---

### Step 6 — The “it gave me a tip” beat (0:30–0:36)

**SAY:** *(still silent — let the agent finish its micro-step suggestion)*

**SHOW:**
- Caption: **And it told me what to try tomorrow.**

**Why:** The agent is prompt-engineered to deliver **one concrete next-24-hour step** — let viewers hear it.

---

### Step 7 — Barge-in (0:36–0:40)

**SAY:** *(interrupt the agent mid-sentence — talk over it casually)*

> *“Wait — what about the New York one?”*

**SHOW:**
- Agent stops, listens, picks up. Speech Engine handles the turn-take.
- Caption: **I interrupted it. It handled it.**

**Why:** Visceral proof of Speech Engine barge-in. Judges love it; viewers feel it.

---

### Step 8 — End + privacy punch (0:40–0:46)

**SAY:** *“ElevenLabs handles the voice. My server owns the memory.”*

**SHOW:**
- End the session → green **“Saved to your local journal.”**
- Caption: **My words stay on my machine.**

---

### Step 9 — Dashboard insights (0:46–0:56)

**SAY:** *“It read my whole week and told me the pattern — not just ‘bad day, 4/10.’”*

**SHOW:**
- `/dashboard` — slow scroll: streak → **What the AI noticed** card → one entry card → emotional timeline.
- Optional: tap **Play** on the weekly recap audio (ElevenLabs TTS).
- Caption: **Patterns. Not mood logs.**

---

### Step 10 — Threads (0:56–1:04)

**SAY:** *“Worries on one map. Bright threads on the other. With suggested actions for both.”*

**SHOW:**
- `/threads` — worry map → expand one thread → tap to show **suggested actions** → swap to bright threads.
- Caption: **Worries fade. Bright threads rise.**

---

### Step 11 — Memoir (1:04–1:14)

**SAY:** *(nothing — let the audio play)*

**SHOW:**
- `/memoir` — hit **Play** — narration + ambient music run for **8–10 seconds**.
- Caption: **Year-end memoir · ElevenLabs TTS + Eleven Music**

**Why:** The audio is the hero. This is the “how is this real?” moment.

---

### Step 12 — Tech reveal (1:14–1:20)

**SAY:** *“Speech Engine does the voice. Our server runs OpenAI, owns the memory, writes the memoir. Fork the repo and run it on localhost in 10 minutes.”*

**SHOW:**
- Landing **Speech Engine benefits** card OR a simple text slide:

```
Browser ↔ ElevenLabs Speech Engine (STT + TTS + barge-in)
                        ↕
   Your Next.js server ↔ OpenAI ↔ SQLite memory
                        ↓
   Year-end memoir = ElevenLabs TTS + Eleven Music
```

- Caption: **Speech Engine = voice · Your server = brain + memory**

---

### Step 13 — CTA (1:20–1:25)

**SAY:** *“Link in description. #ElevenHacks.”*

**SHOW:**
- End card, black + amber:
- Caption: **Voice Journal · github.com/JuampiHernandez/Voice-Journal · #ElevenHacks @elevenlabsio**

---

## Plan B — if the live voice line doesn’t land

If the agent doesn’t reference past entries on take 1:

- **Keep going.** Don’t re-record from scratch.
- After **Step 7** (barge-in), cut straight to **Step 9** (dashboard).
- Add VO: *“Even when the live line missed, the weekly summary nailed the pattern.”*

The dashboard + threads + memoir alone still tell the story.

---

## TikTok / Reels cut (~30 seconds)

Same footage, tighter — keep the **hook**, the **memory beat**, the **tip beat**, the **memoir audio**, and the **CTA**.

| Time | Clip | Caption |
|------|------|---------|
| 0:00–0:03 | Face cam or dashboard headline | **I built myself an AI psychologist.** |
| 0:03–0:06 | Landing scroll | **3 minutes a day. It remembers me.** |
| 0:06–0:14 | Live agent line that proves memory + gives a tip | **It remembered. And it told me what to try.** |
| 0:14–0:20 | Threads map — one worry + one bright thread | **Worries fade. Bright threads rise.** |
| 0:20–0:27 | Memoir audio peak (best 6–7 seconds) | **Year-end memoir · ElevenLabs TTS + Music** |
| 0:27–0:30 | End card | **#ElevenHacks @elevenlabsio** |

**Caption template (X / LinkedIn / IG / TikTok):**

```
I built myself an AI psychologist 🎙️
3 minutes of voice a day. It remembers me, gives me tips,
and turns the year into a narrated memoir with music.

Voice = ElevenLabs Speech Engine (STT + TTS + barge-in)
Brain = my server (OpenAI + SQLite memory)
Score = Eleven Music API

Repo + 10-min local setup in the comments.
#ElevenHacks @elevenlabsio
```

Post on X, LinkedIn, Instagram, TikTok (+50 pts each per hackathon rules).

---

## Feature guide — everything in the app

Use this for a **longer live demo** (3–5 min) or a **written submission**.

### 1. Landing (`/`)

| Feature | What to show |
|---------|----------------|
| Hero | “Daily 3-minute check-ins → yearly memoir” |
| Feature grid | Speech Engine · Weekly recap · Threads · Year-end memoir |
| Judges section (production) | Showcase user picker — view-only demo journal |
| Local setup | Copy-paste commands for fork + `npm run dev:full` |
| Speech Engine benefits | Latency, integrated pipeline, BYO LLM, turn-taking |

**Say:** “Production is the story. Localhost is where voice lives.”

---

### 2. Voice check-in (`/journal`) — **localhost only**

| Feature | What to show |
|---------|----------------|
| 3-minute timer ring | Hard cap — companion wraps up at ~2:30 |
| Real-time voice | ElevenLabs client → Speech Engine WebSocket |
| Agent personality | Warm companion, not clinical therapy |
| **Memory** | References recent entries from SQLite |
| **Barge-in** | User interrupts mid-response |
| Post-session save | Transcript → OpenAI analysis → SQLite |
| Per-browser user id | Auto in `localStorage`; optional `?user=YourName` |

**Technical one-liner:** Browser audio ↔ ElevenLabs Speech Engine ↔ your Node server (OpenAI + SQLite).

---

### 3. Dashboard (`/dashboard`)

| Feature | What to show |
|---------|----------------|
| Streak | Consecutive check-in days |
| **What the AI noticed** | Weekly summary + insight bullets |
| Weekly recap audio | ElevenLabs TTS narration of the summary |
| Entry cards | Mood score, themes, expandable transcript |
| Emotional timeline | Notable beats across the week |
| Demo seed button | Local only — loads sample week |

**Say:** “This isn’t sentiment analysis on one message — it’s a week of context.”

---

### 4. Threads (`/threads`)

| Feature | What to show |
|---------|----------------|
| Worry threads | Recurring anxieties with trend: rising / stable / fading |
| Bright threads | What’s working — creativity, relationships, wins |
| Thread maps | Visual nodes + date ranges |
| Focus recommendation | AI suggests what to address this week |
| Celebrate recommendation | AI suggests what to acknowledge |
| Suggested actions | Per-thread micro-steps |

**Say:** “Therapists ask ‘what’s the pattern?’ — this answers it visually.”

---

### 5. Memoir (`/memoir`)

| Feature | What to show |
|---------|----------------|
| Year-end script | OpenAI weaves entries into narrative |
| Narration | ElevenLabs TTS |
| Score | **Eleven Music API** — ambient bed under voice |
| Play both tracks | Narration full volume, music ~15% |

**Say:** “365 days of 3-minute check-ins → one listenable chapter of your life.”

---

## Technical deep dive (end of video or README for judges)

### Architecture

```text
Browser (localhost)
  │
  ├── @elevenlabs/client ──► ElevenLabs Speech Engine (STT + TTS + WebRTC)
  │                              │
  │                              ▼
  └── Next.js (:3001) ◄──── ngrok public URL ◄── Speech Engine server (:3002)
            │                                        │
            └── SQLite (data/voice-journal.db)       └── OpenAI (agent + analysis)
```

### Stack

| Layer | Tech |
|-------|------|
| Voice transport | ElevenLabs **Speech Engine** (Scribe v2 Realtime STT, Flash TTS, barge-in) |
| Voice UI | `@elevenlabs/client` `Conversation.startSession` |
| Agent brain | **OpenAI** (`gpt-4o-mini`) — prompts, memory context, analysis |
| App | **Next.js 16** App Router |
| Database | **SQLite** via `better-sqlite3` — local-first, gitignored |
| Memoir narration | ElevenLabs TTS |
| Memoir music | **Eleven Music API** |
| Tunnel | **ngrok** — Speech Engine needs a public URL for ElevenLabs |

### Why Speech Engine (not ElevenAgents cloud memory)?

- A **year of private journal entries** should live on **your** machine.
- You control prompts, analysis schemas, thread logic, and memoir generation.
- ElevenLabs owns the hard part: **low-latency voice**, turn-taking, and interruption.
- Your server streams OpenAI tokens back into Speech Engine for speech output.

### Data flow (one check-in)

1. User speaks → Speech Engine STT → transcript to your server.
2. Server builds prompt with **last 7 entries + open threads** from SQLite.
3. OpenAI streams reply → Speech Engine TTS → user hears agent.
4. Session ends → full transcript → OpenAI **analysis** (mood, themes, emotional moments).
5. Row saved to `journal_entries` → dashboard + threads update on next load.

### Key env vars

| Variable | Purpose |
|----------|---------|
| `ELEVENLABS_API_KEY` | Speech Engine, TTS, Music |
| `OPENAI_API_KEY` | Agent, analysis, weekly summary, threads, memoir script |
| `SPEECH_ENGINE_ID` | Set by `npm run setup:speech-engine` |
| `SPEECH_ENGINE_WS_URL` | ngrok URL — synced to ElevenLabs |

---

## Run it yourself (10-minute setup)

Full commands: [LOCAL_SETUP.md](./LOCAL_SETUP.md)

### First time

```bash
git clone https://github.com/JuampiHernandez/Voice-Journal.git
cd Voice-Journal
npm install
cp .env.example .env
# Edit .env: ELEVENLABS_API_KEY, OPENAI_API_KEY

# Terminal A — leave running:
ngrok http 3002

# Terminal B — once:
npm run setup:speech-engine
```

### Every session

```bash
npm run dev:full
# Opens Next.js (:3001) + Speech Engine (:3002) + ngrok sync
```

Open: **http://localhost:3001/journal**

Optional second journal on same machine: `?user=YourName`

### Commands cheat sheet

| Command | What it does |
|---------|----------------|
| `npm run dev` | Next.js only (dashboard, threads, memoir — no live voice) |
| `npm run dev:full` | Full stack for voice check-ins |
| `npm run prep:demo-video` | Seed demo data + optional memoir for recording |
| `npm run seed:demo-narrative` | Seed a fictional narrative week (needs OpenAI key) |
| `npm run sync:speech-engine` | Re-sync ngrok URL after tunnel restart |

Database: `data/voice-journal.db` (created automatically, never committed to git).

---

## Submission package ([Hack #10](https://hacks.elevenlabs.io/hackathons/9))

1. **Video** — judge cut (60–75 s) from this script
2. **Title:** *Voice Journal — 3-min daily check-ins that become your yearly memoir (Speech Engine)*
3. **Description bullets:**
   - Speech Engine for real-time voice + barge-in; custom OpenAI agent + SQLite memory
   - Weekly “what the AI noticed” + voiced recap
   - Worry & bright thread maps
   - Year-end memoir: ElevenLabs TTS + Eleven Music
4. **Repo URL** + deployed demo URL (view-only; voice on localhost)
5. **Social:** `@elevenlabsio` + `#ElevenHacks` on every platform

---

## B-roll shots (2 s each — makes edits feel cinematic)

- Timer ring pulsing amber
- Mood **4.5/10** on an entry card
- Theme tags: `travel` · `uncertainty` · `anxiety`
- Emotional timeline row (“release cry” moment)
- Thread map nodes connecting across dates
- Memoir waveform while narration plays

---

## Plan B scripts (if something breaks on camera)

| Failure | Fallback line |
|---------|----------------|
| Agent doesn’t connect | “Speech Engine runs on localhost — here’s what yesterday’s session saved.” → cut to dashboard |
| Memory miss | “Even without that line landing, watch the weekly summary connect the dots.” → dashboard |
| Memoir won’t play | Show script text + say “narration + Eleven Music generate locally — 60 seconds in the repo” |

---

## Related docs

- Shot-by-shot timing reference: [HACKATHON_DEMO_VIDEO.md](./HACKATHON_DEMO_VIDEO.md)
- Exact terminal commands: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- Deploy / production vs local: [DEPLOY.md](./DEPLOY.md)
