#!/usr/bin/env bash
# Full-stack E2E test runner: boots Django + Vite, runs the Puppeteer suite, tears down.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VITE_LOG=/tmp/smartlearn-e2e-vite.log
DJANGO_LOG=/tmp/smartlearn-e2e-django.log

DJANGO_PID=""
VITE_PID=""
cleanup() {
  if [[ -n "$VITE_PID" ]] && kill -0 "$VITE_PID" 2>/dev/null; then kill "$VITE_PID" 2>/dev/null || true; fi
  if [[ -n "$DJANGO_PID" ]] && kill -0 "$DJANGO_PID" 2>/dev/null; then kill "$DJANGO_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

echo "==> Starting Django backend on :8000"
"$ROOT/backend/venv/bin/python" "$ROOT/backend/manage.py" runserver 127.0.0.1:8000 >"$DJANGO_LOG" 2>&1 &
DJANGO_PID=$!

echo "==> Starting Vite dev server on :5173"
npm --prefix "$ROOT" run dev -- --host 127.0.0.1 --port 5173 >"$VITE_LOG" 2>&1 &
VITE_PID=$!

echo "==> Waiting for servers..."
BACKEND_UP=0
FRONTEND_UP=0
for _ in $(seq 1 60); do
  if [[ $BACKEND_UP -eq 0 ]] && curl -sf -o /dev/null "http://127.0.0.1:8000/api/courses/"; then
    BACKEND_UP=1
  fi
  if [[ $FRONTEND_UP -eq 0 ]] && curl -sf -o /dev/null "http://127.0.0.1:5173/"; then
    FRONTEND_UP=1
  fi
  if [[ $BACKEND_UP -eq 1 && $FRONTEND_UP -eq 1 ]]; then break; fi
  sleep 1
done
if [[ $BACKEND_UP -eq 0 || $FRONTEND_UP -eq 0 ]]; then
  echo "ERROR: servers did not come up." >&2
  echo "----- Django log -----" >&2; cat "$DJANGO_LOG" >&2
  echo "----- Vite log -----" >&2; cat "$VITE_LOG" >&2
  exit 2
fi

echo "==> Running E2E suite..."
node "$ROOT/e2e/run.js"