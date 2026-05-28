#!/bin/bash
# Start speech-engine + ngrok + sync + Next.js dev server (one command)
set -e
cd "$(dirname "$0")/.."
# shellcheck source=lib/dev-ports.sh
source "$(dirname "$0")/lib/dev-ports.sh"

STARTED_SPEECH_ENGINE=0
STARTED_NGROK=0
STARTED_NEXT=0

cleanup_voice() {
  if [[ "$STARTED_NGROK" == 1 ]]; then
    pkill -f "ngrok http 3002" 2>/dev/null || true
  fi
  if [[ "$STARTED_SPEECH_ENGINE" == 1 ]]; then
    local pids
    pids=$(port_pids 3002)
    if [[ -n "$pids" ]]; then
      echo "$pids" | xargs kill 2>/dev/null || true
    fi
  fi
}

cleanup_all() {
  echo ""
  echo "Stopping…"
  cleanup_voice
  if [[ "$STARTED_NEXT" == 1 ]]; then
    local pids
    pids=$(port_pids 3001)
    if [[ -n "$pids" ]]; then
      echo "$pids" | xargs kill 2>/dev/null || true
    fi
  fi
}

trap cleanup_all INT TERM

se_was_healthy=0
ngrok_was_up=0
speech_engine_healthy && se_was_healthy=1
ngrok_running && ngrok_was_up=1

bash scripts/dev-voice.sh

speech_engine_healthy && [[ "$se_was_healthy" == 0 ]] && STARTED_SPEECH_ENGINE=1
ngrok_running && [[ "$ngrok_was_up" == 0 ]] && STARTED_NGROK=1

echo ""

if port_in_use 3001; then
  if wait_for_http "http://127.0.0.1:3001" "Next.js" 3; then
    echo "→ Next.js already running: http://localhost:3001"
    echo "→ Voice stack is up. Press Ctrl+C to stop only what this script started."
    echo ""
    STARTED_NEXT=0
    trap cleanup_voice INT TERM
    while true; do sleep 86400; done
  else
    echo "✗ Port 3001 is in use but not responding. Free it first:"
    lsof -i :3001 || true
    echo "  kill \$(lsof -ti :3001)"
    exit 1
  fi
fi

echo "→ Next.js: http://localhost:3001"
echo "→ Press Ctrl+C to stop everything this script started"
echo ""

STARTED_NEXT=1
npm run dev || {
  echo ""
  echo "✗ Next.js failed to start. Voice stack is still running."
  echo "  Open http://localhost:3001 if another dev server is already up."
  echo "  Or free port 3001: kill \$(lsof -ti :3001)"
  STARTED_NEXT=0
  exit 1
}

cleanup_all
