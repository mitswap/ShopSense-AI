#!/bin/sh
set -eu

FAST_MODEL="${OLLAMA_MODEL:-llama3.2:1b}"
REASONER_MODEL="${OLLAMA_REASONER_MODEL:-deepseek-r1:1.5b}"
AUTO_PULL="${OLLAMA_AUTO_PULL:-true}"
OLLAMA_HOST="${OLLAMA_HOST:-0.0.0.0:11434}"

# Start Ollama in background if available.
if command -v ollama >/dev/null 2>&1; then
  export OLLAMA_HOST
  echo "[startup] launching Ollama on ${OLLAMA_HOST}"
  ollama serve >/tmp/ollama.log 2>&1 &

  # Wait up to 30 seconds for the local daemon.
  ATTEMPTS=0
  until ollama list >/dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "${ATTEMPTS}" -ge 30 ]; then
      echo "[startup] Ollama not ready after 30s; continuing with API startup"
      break
    fi
    sleep 1
  done

  # Pull models in background so Render startup is not blocked.
  if [ "${AUTO_PULL}" = "true" ] && ollama list >/dev/null 2>&1; then
    (
      echo "[startup] ensuring model ${FAST_MODEL}"
      ollama pull "${FAST_MODEL}" || true
      if [ "${REASONER_MODEL}" != "${FAST_MODEL}" ]; then
        echo "[startup] ensuring model ${REASONER_MODEL}"
        ollama pull "${REASONER_MODEL}" || true
      fi
    ) &
  fi
else
  echo "[startup] Ollama binary not found; API will run without local Ollama"
fi

exec node server/dev-server.mjs
