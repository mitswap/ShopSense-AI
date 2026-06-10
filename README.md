# ShopSense AI

ShopSense AI is a retail operations copilot for SME clothing shops. It helps owners upload existing business data, import supplier memos, track inventory health, understand festival demand, ask natural-language business questions, and receive grounded AI advice in English or Bangla.

## Current Product Scope

- Additive CSV import with flexible schema detection
- Supplier memo OCR with preview and confirm-before-write flow
- Live inventory management with manual add-product support
- KPI dashboard for sales, profit, growth, best seller, low stock, and dead stock
- Festival-aware analytics with inferred Eid and Puja windows
- Shop Analyzer chat interface for grounded product and sales questions
- Individual product analysis for sales-change reasoning
- Today-specific weather advice for the shop city
- Bangla-ready UI and localized product/category labels
- Shared local and Vercel-compatible code paths

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, Recharts, TanStack Query |
| API | Express 5, serverless-compatible `api/index.mjs`, Vercel rewrites |
| Data | Supabase Postgres + pgvector, optional localStorage demo mode |
| CSV / Validation | PapaParse, Zod, canonical schema detection |
| AI | Hugging Face Inference Providers, OpenRouter chat + embeddings, optional local Ollama |
| OCR | OCR.Space |

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the required values.

Important variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_API_KEY_FALLBACK`
- `HF_TOKEN`
- `HF_TOKEN_FALLBACK`
- `OCR_SPACE_API_KEY`
- `OCR_SPACE_API_KEY_FALLBACK`

If your frontend and backend are separated, also set:

- `VITE_API_BASE_URL`

### 3. Run locally

```bash
npm run dev
npm run dev:api
```

Or run both together:

```bash
npm run dev:all
```

Frontend:

- `http://localhost:5173`

API:

- `http://localhost:3001`

### 4. Optional smoke checks

```bash
npm run test:smoke
```

## Deployment Notes

### Vercel

- `vercel.json` already rewrites `/api/*` to the serverless entry
- mirror the same provider env vars from `.env` into Vercel project settings
- use the fallback key variables in Vercel too for parity

### Render

- Render is recommended only if you want a dedicated long-running Express API or optional Ollama runtime
- see [DEPLOY-RENDER.md](./DEPLOY-RENDER.md)

### Hugging Face / OpenRouter

- Hugging Face and OpenRouter are both supported in the current runtime
- the code now supports primary and fallback keys for both providers
- see [DEPLOY-HUGGINGFACE.md](./DEPLOY-HUGGINGFACE.md)

## Sample Data

- `public/sample-inventory.csv`
- `public/sme_data.csv`
- `public/Demo_image.jpg`

## Security

- Never commit `.env`
- Never expose secret keys through `VITE_*`
- If a key was ever shared publicly, rotate it before production use

## Documentation

- public docs: `/docs`
- docs admin: `/docs/admin`

## License

MIT
