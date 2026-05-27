#!/bin/bash
# Start ngrok + speech-engine for local voice dev
set -e
cd "$(dirname "$0")/.."

speech_engine_healthy() {
  curl -sf http://127.0.0.1:3002/health >/dev/null 2>&1
}

ngrok_tunnel_url() {
  for port in 4040 4041 4042 4043 4044 4045; do
    url=$(curl -sf "http://127.0.0.1:${port}/api/tunnels" 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(1)
for t in data.get('tunnels', []):
    addr = (t.get('config') or {}).get('addr', '')
    if '3002' in addr and t.get('public_url'):
        print(t['public_url'])
        sys.exit(0)
sys.exit(1)
" 2>/dev/null || true)
    if [[ -n "$url" ]]; then
      echo "$url"
      return 0
    fi
  done
  return 1
}

stop_speech_engine() {
  if lsof -ti :3002 >/dev/null 2>&1; then
    kill $(lsof -ti :3002) 2>/dev/null || true
    sleep 1
  fi
}

stop_ngrok() {
  pkill -f "ngrok http 3002" 2>/dev/null || true
  sleep 1
}

if lsof -ti :3002 >/dev/null 2>&1 && speech_engine_healthy; then
  echo "speech-engine already on :3002 (healthy)"
else
  if lsof -ti :3002 >/dev/null 2>&1; then
    echo "stale process on :3002 — restarting speech-engine"
  fi
  stop_speech_engine
  npm run speech-engine &
  sleep 2
  if ! speech_engine_healthy; then
    echo "✗ speech-engine failed to start on :3002"
    exit 1
  fi
fi

if ngrok_tunnel_url >/dev/null; then
  echo "ngrok already running for :3002"
else
  if pgrep -f "ngrok http 3002" >/dev/null 2>&1; then
    echo "stale ngrok for :3002 — restarting"
  fi
  stop_ngrok
  ngrok http 3002 &
  sleep 3
  if ! ngrok_tunnel_url >/dev/null; then
    echo "✗ ngrok failed to expose :3002"
    exit 1
  fi
fi

npm run sync:speech-engine
echo ""
echo "✓ Voice stack ready. Run npm run dev in another terminal."
