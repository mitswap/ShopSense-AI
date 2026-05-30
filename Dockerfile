# Full API + local Ollama in one container (Render paid plan required).
# We copy the Node runtime into the official Ollama image so both binaries are present.
FROM node:20-bookworm-slim AS node-runtime

FROM ollama/ollama:latest

WORKDIR /app

COPY --from=node-runtime /usr/local /usr/local

COPY package*.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY scripts ./scripts
COPY docker/start-with-ollama.sh /start.sh

RUN chmod +x /start.sh

ENV NODE_ENV=production
ENV RENDER=true
ENV PORT=10000
ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_BASE_URL=http://127.0.0.1:11434
ENV OLLAMA_MODEL=llama3.2:1b
ENV OLLAMA_REASONER_MODEL=deepseek-r1:1.5b
ENV OLLAMA_AUTO_PULL=true
ENV OLLAMA_OPENROUTER_FALLBACK=true

EXPOSE 10000 11434

CMD ["/start.sh"]
