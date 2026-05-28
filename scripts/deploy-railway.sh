#!/bin/bash
# Deploy Speech Engine to Railway (Next.js stays on Vercel).
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v railway >/dev/null 2>&1; then
  RAILWAY="npx railway"
  if ! $RAILWAY --version >/dev/null 2>&1; then
    echo "Railway CLI not found. Install dev deps: npm install"
    exit 1
  fi
else
  RAILWAY="railway"
fi

echo "Deploying Speech Engine (Dockerfile.speech-engine)…"
$RAILWAY up --detach

echo ""
echo "Next steps:"
echo "  1. Railway → Networking → copy public domain"
echo "  2. SPEECH_ENGINE_WS_URL=wss://YOUR-DOMAIN.up.railway.app/ws npm run setup:production"
echo "  3. Add SPEECH_ENGINE_ID + SPEECH_ENGINE_WS_URL to Vercel env"
echo ""
echo "See docs/DEPLOY.md for the full checklist."
