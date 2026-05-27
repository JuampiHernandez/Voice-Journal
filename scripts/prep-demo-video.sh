#!/usr/bin/env bash
# Prepare Voice Journal for hackathon demo recording.
# Usage: ./scripts/prep-demo-video.sh [--with-memoir] [--voice-stack]
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BASE_URL="${BASE_URL:-http://localhost:3001}"
DEMO_USER_ID="${DEMO_USER_ID:-demo-video}"
WITH_MEMOIR=false
START_VOICE=false

for arg in "$@"; do
  case "$arg" in
    --with-memoir) WITH_MEMOIR=true ;;
    --voice-stack) START_VOICE=true ;;
    -h|--help)
      echo "Usage: ./scripts/prep-demo-video.sh [--with-memoir] [--voice-stack]"
      echo ""
      echo "  --with-memoir   Pre-generate year memoir (TTS + Music, ~1–3 min)"
      echo "  --voice-stack   Start speech-engine + ngrok + sync (for live voice shots)"
      echo ""
      echo "Env: BASE_URL (default http://localhost:3001), DEMO_USER_ID (default demo-video)"
      exit 0
      ;;
  esac
done

echo "═══════════════════════════════════════════════════════════════"
echo "  Voice Journal — demo video prep"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# --- env checks ---
missing=()
[[ -z "${ELEVENLABS_API_KEY:-}" ]] && missing+=("ELEVENLABS_API_KEY")
[[ -z "${OPENAI_API_KEY:-}" ]] && missing+=("OPENAI_API_KEY")
if ((${#missing[@]})); then
  echo "⚠ Missing in .env: ${missing[*]}"
  echo "  Voice + memoir shots need both keys."
else
  echo "✓ API keys present in environment"
fi

if $START_VOICE; then
  echo ""
  echo "→ Starting voice stack (speech-engine + ngrok)…"
  bash scripts/dev-voice.sh
fi

# --- app reachable ---
echo ""
echo "→ Checking app at $BASE_URL …"
if ! curl -sf "$BASE_URL/api/config" -o /tmp/vj-config.json 2>/dev/null; then
  echo "✗ App not reachable. Start it first:"
  echo "    npm run dev"
  echo "  Then re-run this script."
  exit 1
fi
echo "✓ App is up"

if command -v python3 >/dev/null 2>&1; then
  speech_ready=$(python3 -c "import json; print(json.load(open('/tmp/vj-config.json')).get('speechEngineReady', False))" 2>/dev/null || echo "false")
  if [[ "$speech_ready" == "True" || "$speech_ready" == "true" ]]; then
    echo "✓ Speech Engine ready (live /journal shots OK)"
  else
    echo "⚠ Speech Engine not ready — use --voice-stack or run: npm run dev:voice"
    echo "  You can still record dashboard + memoir from seeded data."
  fi
fi

# --- seed week ---
echo ""
echo "→ Seeding demo week for user: $DEMO_USER_ID …"
seed_res=$(curl -sf -X POST "$BASE_URL/api/demo/seed" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$DEMO_USER_ID\"}" || true)

if [[ -z "$seed_res" ]]; then
  echo "✗ Demo seed failed (is OPENAI_API_KEY set and dev server running?)"
  exit 1
fi
echo "✓ Seeded entries: $seed_res"

# --- weekly summary (warm cache) ---
echo ""
echo "→ Generating weekly summary …"
weekly_res=$(curl -sf "$BASE_URL/api/weekly-summary?userId=$DEMO_USER_ID" || true)
if [[ -n "$weekly_res" ]]; then
  echo "✓ Weekly summary cached"
else
  echo "⚠ Weekly summary request failed"
fi

# --- optional memoir ---
if $WITH_MEMOIR; then
  echo ""
  echo "→ Generating memoir (narration + music — may take 1–3 minutes) …"
  year=$(date +%Y)
  memoir_res=$(curl -sf -X POST "$BASE_URL/api/memoir" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$DEMO_USER_ID\",\"year\":$year}" || true)
  if [[ -n "$memoir_res" ]]; then
    echo "✓ Memoir ready for $year"
  else
    echo "✗ Memoir generation failed — check ELEVENLABS_API_KEY and logs"
  fi
fi

# --- browser identity ---
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Before you hit Record"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. Open Chrome/Safari in a clean window (or Incognito)."
echo "2. Open DevTools → Console and paste:"
echo ""
echo "   localStorage.setItem('voice-journal-user-id', '$DEMO_USER_ID');"
echo "   location.reload();"
echo ""
echo "3. Open these tabs (in recording order):"
echo "   • $BASE_URL/journal"
echo "   • $BASE_URL/dashboard"
echo "   • $BASE_URL/memoir"
echo ""
echo "4. Read the full shot list:"
echo "   docs/HACKATHON_DEMO_VIDEO.md"
echo ""
echo "5. Submission tags: @elevenlabsio  #ElevenHacks"
echo ""
echo "Optional: hide debug on journal — do NOT add ?debug to the URL."
echo "═══════════════════════════════════════════════════════════════"
