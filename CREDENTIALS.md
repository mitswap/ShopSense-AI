# Credentials — already in `.env` (gitignored)

Configured for:
- **OpenRouter** (LLM + embeddings) — no paid Google Gemini key required
- **Supabase** (new `sb_publishable_` / `sb_secret_` keys supported)

## You must still do in Supabase Dashboard

1. **SQL Editor** — run in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_vector_search.sql`
   - If you already ran old 001 with `vector(768)`, also run `003_embedding_1536.sql`

2. **Extensions** → enable **vector**

## Ollama (local LLM) — installed via winget

```powershell
ollama list
ollama pull llama3          # full model ~4.7GB (optional)
# Currently using llama3.2:1b in .env (lighter, already pulled)

npm run setup:ollama      # re-pull / verify API
```

Ollama runs as a Windows app on `http://127.0.0.1:11434`.

## Local reasoning (Ollama — no paid API)

Insight and root-cause use a **local reasoner** model (default `deepseek-r1:1.5b`):

```powershell
ollama pull deepseek-r1:1.5b
# optional larger: ollama pull deepseek-r1:7b
```

Set in `.env`: `OLLAMA_REASONER_MODEL=deepseek-r1:1.5b`  
Fast tasks / translation use `OLLAMA_MODEL=llama3.2:1b`.

Cloud OpenRouter is only a fallback if Ollama is down.

## Run app

```powershell
cd sme-ai-dashboard
npm run dev:all
```

3. Open http://localhost:5173
4. Click **Vector RAG সিড** (needs OpenRouter credits for embeddings)
5. Upload `public/sme_data.csv`

## Security

If you shared API keys in chat, **rotate** them in OpenRouter + Supabase dashboards.
