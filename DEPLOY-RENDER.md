# Deploy to Render

Use Render only if you want a dedicated backend service instead of relying fully on the Vercel serverless API path.

## Recommended Use Cases

- dedicated always-on Express backend
- optional local Ollama runtime
- separate frontend/backend hosting
- easier long-lived server process behavior

## Supported Modes

1. `render.yaml`
   - standard backend deployment
   - suitable when cloud providers like Hugging Face and OpenRouter handle reasoning

2. `render.ollama.yaml`
   - Docker + Ollama oriented deployment
   - use this only if you intentionally want local model hosting on Render

## Recommended Architecture

- Vercel: frontend
- Render: Express API
- Supabase: optional persistence and vector storage
- Hugging Face / OpenRouter: cloud reasoning and fallback

## Required Environment Variables

At minimum:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_API_KEY_FALLBACK`
- `HF_TOKEN`
- `HF_TOKEN_FALLBACK`
- `OCR_SPACE_API_KEY`
- `OCR_SPACE_API_KEY_FALLBACK`

Optional:

- `OPENROUTER_SITE_URL`
- `VITE_API_BASE_URL` on the frontend project

## Frontend Connection

If frontend is deployed separately, point it to Render:

```env
VITE_API_BASE_URL=https://YOUR_RENDER_SERVICE.onrender.com
```

## Verify After Deploy

Check:

- `GET /api/health`
- `GET /api/status`
- `GET /api/intelligence/health`
- `GET /api/docs/live`

Also verify:

- CSV import
- supplier memo preview
- Shop Analyzer
- weather advice
- `/docs`

## Notes

- If you do not need Ollama, the cloud-provider path is simpler and lighter.
- If you do use Ollama on Render, expect warm-up time and resource costs.
- Keep the same env names across local, Render, and Vercel for parity.
