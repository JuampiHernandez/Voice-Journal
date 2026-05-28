#!/bin/bash
# Shared helpers for speech-engine + ngrok dev stack

port_pids() {
  lsof -ti :"$1" 2>/dev/null || true
}

port_in_use() {
  [[ -n "$(port_pids "$1")" ]]
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local max="${3:-15}"
  local i=1
  while [[ $i -le $max ]]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "✗ $label not ready after ${max}s ($url)"
  return 1
}

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

ngrok_running() {
  ngrok_tunnel_url >/dev/null 2>&1
}
