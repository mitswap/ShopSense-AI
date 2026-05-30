# SME AI Dashboard

BuildFest 2026 - E-Commerce track - Bangladesh apparel retail

AI-powered analytics for small shop owners:
CSV upload -> dashboard -> forecasting -> RAG knowledge -> Bengali/English AI insights.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts, PapaParse, Zod |
| API | Node/Express (local dev + Vercel serverless routing) |
| Data | Supabase (Postgres + optional pgvector) or localStorage demo mode |
| Forecast | Moving average + trend + festival multipliers |
| RAG | In-app knowledge + Supabase `knowledge_chunks` |
| LLM | Local Ollama OR Hugging Face cloud fallback (`HF_TOKEN`) + optional OpenRouter |
| Deploy | Vercel (frontend + API), optional Render |

## Quick Start

### 1) Install

```bash
cd sme-ai-dashboard
npm install
```

### 2) Environment

Copy `.env.example` to `.env` and fill values.

Important variables:

- `VITE_API_BASE_URL` (only if frontend points to a separate backend)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `HF_TOKEN` (for cloud LLM fallback when local Ollama is unavailable)
- `OPENROUTER_API_KEY` (optional embeddings/cloud fallback)

### 3) Run locally

```bash
npm run dev         # frontend only
npm run dev:all     # frontend + API
```

Open: `http://localhost:5173`

### 4) Deploy

- Frontend/API on Vercel: keep `/api/*` routes as configured in `vercel.json`
- Optional Render backend docs: [`DEPLOY-RENDER.md`](./DEPLOY-RENDER.md)
- Hugging Face backend migration guide: [`DEPLOY-HUGGINGFACE.md`](./DEPLOY-HUGGINGFACE.md)

## CSV format

```csv
sku,product_name,product_name_bn,category,stock_qty,unit_cost,sale_date,qty_sold,unit_price
```

Alternate names are supported: `name`, `quantity`, `date`, `quantity_sold`.

## Security

- Never put private keys in `VITE_*` variables.
- Rotate any key you accidentally shared publicly.

## License

MIT