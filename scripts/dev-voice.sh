#!/bin/bash
# Start ngrok + speech-engine for local voice dev
set -e
cd "$(dirname "$0")/.."
# shellcheck source=lib/dev-ports.sh
source "$(dirname "$0")/lib/dev-ports.sh"

stop_speech_engine() {
  local pids
  pids=$(port_pids 3002)
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
  fi
}

stop_ngrok() {
  pkill -f "ngrok http 3002" 2>/dev/null || true
  sleep 1
}

# ngrok must be up BEFORE speech-engine — server syncs wsUrl on startup
if ngrok_running; then
  echo "ngrok already running for :3002 ($(ngrok_tunnel_url))"
else
  if pgrep -f "ngrok http 3002" >/dev/null 2>&1; then
    echo "stale ngrok for :3002 — restarting"
  fi
  stop_ngrok
  echo "starting ngrok for :3002…"
  ngrok http 3002 >/dev/null 2>&1 &
  sleep 3
  if ! ngrok_running; then
    echo "✗ ngrok failed to expose :3002"
    echo "  Install ngrok: https://ngrok.com/download"
    echo "  Or run manually: ngrok http 3002"
    exit 1
  fi
  echo "ngrok tunnel: $(ngrok_tunnel_url)"
fi

if port_in_use 3002 && speech_engine_healthy; then
  echo "speech-engine already on :3002 (healthy)"
else
  if port_in_use 3002; then
    echo "stale process on :3002 — restarting speech-engine"
  fi
  stop_speech_engine
  echo "starting speech-engine on :3002…"
  npm run speech-engine &
  if ! wait_for_http "http://127.0.0.1:3002/health" "speech-engine" 25; then
    echo "  Check .env has ELEVENLABS_API_KEY, OPENAI_API_KEY, SPEECH_ENGINE_ID"
    exit 1
  fi
  echo "speech-engine ready"
fi

npm run sync:speech-engine
echo ""
echo "✓ Voice stack ready. Run npm run dev in another terminal."
