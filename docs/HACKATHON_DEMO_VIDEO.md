# Hackathon demo video — judge + viral playbook

**Goal:** One **60–75 second** submission video that proves **ElevenLabs Speech Engine** (not a generic chatbot), plus an optional **25–30 second** TikTok cut from the same footage.

**Prep before recording:**

```bash
# Terminal 1
npm run dev

# Terminal 2 (voice shots + seed data)
./scripts/prep-demo-video.sh --voice-stack --with-memoir
```

Then set the demo user in the browser (printed by the script).

---

## What judges need to see (scoring lens)

| They care about | You show it by |
|-----------------|----------------|
| **Speech Engine** used creatively | Live voice check-in + agent remembers yesterday |
| **Your LLM**, not a black box | Quick line: “OpenAI on our server — ElevenLabs is only voice” |
| **Real product**, not a slide deck | Dashboard insights + memoir audio |
| **Shareable hook** | Opening line + “what the AI noticed this week” on screen |
| **#ElevenHacks** | End card + caption |

The video is the primary artifact. Make the **first 3 seconds** work with **sound off** (on-screen text).

---

## Recommended length

| Version | Length | Use for |
|---------|--------|---------|
| **Judge cut** | **60–75 s** | Hackathon submission, LinkedIn, X |
| **TikTok cut** | **25–35 s** | Instagram Reels / TikTok (hook → insights → CTA) |

Record **one long take** (~90 s), then trim two edits in CapCut / iMovie / DaVinci.

---

## Pre-flight checklist (15 min before record)

- [ ] `./scripts/prep-demo-video.sh --voice-stack --with-memoir` finished without errors
- [ ] `localStorage` user id set to `demo-video` (from prep script)
- [ ] Mic works; room quiet; headphones **off** (so viewers hear the agent)
- [ ] Browser zoom **100%**, dark mode, **no** `?debug` on `/journal`
- [ ] Close notifications; hide bookmarks bar; full-screen or clean window crop
- [ ] Memoir page already has **Play** ready (don’t wait on generation on camera)
- [ ] Practice the **live voice line** once: agent should mention **yesterday** or **last week**

**What to say on mic during check-in (≈20 s of real speech):**

> “I’m nervous about my trip — New York and San Francisco — still not sure where I’m staying. It’s been on my mind all week.”

That matches your seeded arc (anxiety → patterns → travel) and gives the agent something to remember next time.

---

## Judge cut — shot-by-shot script (≈68 seconds)

Use **bold** lines as on-screen captions (large, bottom third). Speak the *italic* lines or use voiceover.

| Time | Shot | On-screen text | Say / VO |
|------|------|----------------|----------|
| **0:00–0:03** | Face cam OR dashboard blur → sharp focus on weekly card | **I voice-journaled every day for a month.** | *Here's what the AI noticed.* |
| **0:03–0:06** | Landing `/` — scroll slightly to “yearly memoir” | **3 min/day → yearly audio memoir** | *(optional)* Voice Journal — built for #ElevenHacks |
| **0:06–0:22** | `/journal` — tap **Start check-in**, timer ring, **speak** 15–20 s | **ElevenLabs Speech Engine** | Let agent respond once; if it references **yesterday** or **last week**, **pause** 1 s so viewers read the moment |
| **0:22–0:26** | Same page — **interrupt** the agent mid-sentence (talk over it) | **Barge-in works** | *(no VO — let interruption happen)* |
| **0:26–0:30** | End session → **“Saved to your local journal”** + summary line | **Your words stay on your server** | *Speech Engine handles voice. We own memory.* |
| **0:30–0:48** | `/dashboard` — slow scroll: streak → **What the AI noticed** → one entry card → emotional timeline | **Patterns the AI caught** | *(read 1 sentence from weekly summary, or VO:)* “It connected my travel anxiety to a need for control — not just a mood log.” |
| **0:48–0:58** | `/memoir` — hit **Play**; let **narration + music** run 8–10 s | **Eleven TTS + Eleven Music** | *(low VO or silence — audio is the hero)* |
| **0:58–1:05** | Split: landing feature card “Speech Engine” OR simple diagram | **Speech Engine = voice layer** · **Your server = brain + memory** | *Why not ElevenAgents? A year of private journal memory lives with you.* |
| **1:05–1:08** | End card (black + amber text) | **Voice Journal** · **@elevenlabsio** · **#ElevenHacks** | *Link in bio* (if you have a deployed URL) |

**Do not show:** ngrok URLs, debug panel, terminal, API keys.

---

## TikTok cut — same footage, tighter (≈28 seconds)

| Time | Clip |
|------|------|
| 0:00–0:03 | Hook text + your face or weekly summary headline |
| 0:03–0:12 | Voice check-in: **one** agent line that proves memory |
| 0:12–0:20 | Dashboard “What the AI noticed” — scroll the emotional sentence |
| 0:20–0:26 | Memoir audio peak (best 6 s of narration) |
| 0:26–0:28 | CTA: **#ElevenHacks @elevenlabsio** |

Caption template:

```
I built a 3-minute voice journal that remembers your whole year 🎙️
ElevenLabs Speech Engine = conversation
My server = memory + insights + memoir
#ElevenHacks @elevenlabsio
```

Post on **X, LinkedIn, Instagram, TikTok** (+50 pts each per hackathon rules).

---

## Live voice moment — script for YOU (not the agent)

Keep it natural; one take is enough.

1. **Start check-in** — wait for greeting.
2. **Say (≈15 s):**  
   *“Hey — I’m still stressed about accommodation for New York and San Francisco. It’s been sitting in the back of my head all week.”*
3. **Listen** — agent should ask a short follow-up or reference past entries (if seeded week is loaded under same user).
4. **Interrupt** once while it’s talking — proves Speech Engine turn-taking.
5. **End early** or let timer finish — show green **Saved to your local journal**.

If memory doesn’t land on first take, **cut to dashboard** anyway; the seeded week still tells the story.

---

## B-roll shots (optional, 2 s each)

Insert between sections if the screen recording feels flat:

- Timer ring pulsing amber
- Mood score **4.5/10** on an entry card
- Tags: `travel` `uncertainty` `anxiety`
- Emotional timeline row (e.g. “release cry” / shower moment from demo seed)
- Waveform or volume meter while memoir plays

---

## Technical talking points (pick **one** for VO)

Use only if you have 5 spare seconds — don’t lecture.

- “ElevenLabs does STT, TTS, WebRTC, and interruptions. We stream OpenAI responses back through Speech Engine.”
- “Journal entries live in **our** SQLite — not ElevenAgents cloud memory.”
- “Year-end memoir: OpenAI writes the script, ElevenLabs narrates, Eleven Music scores it.”

---

## Recording setup

| Setting | Recommendation |
|---------|----------------|
| Resolution | **1920×1080** screen record |
| Frame rate | 30 fps |
| Tool | OBS, QuickTime, or Loom |
| Mic | Phone/laptop mic is OK; stay close |
| Music in edit | **Low** under VO on judge cut; **none** over memoir clip |
| Export | MP4 H.264, &lt; 100 MB for upload |

---

## If voice fails during the shoot

**Plan B** (still a strong submission):

1. Record dashboard + memoir only (30 s).
2. Add **3 s** screen recording from a **previous** successful check-in (you already have screenshots).
3. VO: *“Live demo uses Speech Engine — full repo in description.”*

Judges forgive flaky live audio if the **edited story** is clear.

---

## Submission package

When you upload to [Hack #10](https://hacks.elevenlabs.io/hackathons/9):

1. **Video file** — judge cut (60–75 s)
2. **Title idea:** *Voice Journal — 3-min daily check-ins that become your yearly memoir (Speech Engine)*
3. **Description bullets:**
   - Speech Engine for real-time voice; custom OpenAI agent + SQLite memory
   - Weekly “what the AI noticed” insights
   - Year-end memoir: ElevenLabs TTS + Eleven Music
4. **Repo URL** + optional live demo URL
5. **Social posts** with `@elevenlabsio` and `#ElevenHacks`

---

## One-line pitch (for judges who only read text)

> **Voice Journal** turns three minutes of daily speech into private long-term memory and a narrated year-end memoir — **ElevenLabs Speech Engine** powers the conversation; **your server** owns the brain, analysis, and data.
