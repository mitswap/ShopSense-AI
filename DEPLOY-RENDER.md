# Deploy to Render (Ollama + Llama 3.2 + DeepSeek R1)

This repo supports two deployment modes:

1. `render.yaml` -> Free-tier API with OpenRouter fallback only (no local Ollama).
2. `render.ollama.yaml` -> Docker API with local Ollama inside Render (paid instance + persistent disk).

If you want Ollama on Render, use `render.ollama.yaml`.

## Why Vercel failed for Ollama

Vercel serverless functions cannot host a long-running Ollama daemon.  
Keep frontend on Vercel, and run backend on Render.

## Recommended architecture

- Vercel: React frontend
- Render: backend API (`shopsense-api-ollama`) from `render.ollama.yaml`
- Optional fallback in backend: OpenRouter (if Ollama is warming up or unavailable)

## Step 1: Create the Render service from the Ollama blueprint

1. Push this repo to GitHub.
2. In Render Dashboard, create a **Blueprint**.
3. Set **Blueprint Path** to `render.ollama.yaml`.
4. Create/sync resources.

This creates:

- `shopsense-api-ollama` (Docker web service, `standard` plan by default)
- Persistent disk mounted at `/root/.ollama` (model storage)

## Step 2: Set required Render environment variables

Set these in `shopsense-api-ollama`:

- `OPENROUTER_API_KEY` (optional but recommended as fallback)
- `SUPABASE_URL` (if using Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase)
- `FRONTEND_URL` (your Vercel URL)
- `OPENROUTER_SITE_URL` (optional attribution URL)

Defaults already in the blueprint:

- `OLLAMA_MODEL=llama3.2:1b`
- `OLLAMA_REASONER_MODEL=deepseek-r1:1.5b`
- `OLLAMA_AUTO_PULL=true`
- `OLLAMA_OPENROUTER_FALLBACK=true`

## Step 3: Point frontend to Render backend

In Vercel project env vars:

```env
VITE_API_BASE_URL=https://YOUR_RENDER_SERVICE.onrender.com
```

Redeploy Vercel after setting this.

## Step 4: Verify deployment

After Render is live, check:

- `GET /api/health`
- `GET /api/status`
- `GET /api/intelligence/health`

Expected behavior:

- API is immediately reachable.
- Ollama may show `false` during first model download.
- Once models finish pulling, Ollama health becomes `true`.

## Operational notes

- First boot can take time because models download.
- Persistent disk keeps models across restart/redeploy.
- Free Render web services spin down and do not support persistent disks; use paid instance for stable Ollama.
- If you see memory/OOM errors, upgrade the service to a larger instance type.
