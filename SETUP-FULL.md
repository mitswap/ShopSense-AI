# Full Setup Guide

This guide is for running the full current ShopSense AI product locally before deployment.

## What You Get

- frontend dashboard
- local Express API
- additive CSV import flow
- supplier memo OCR preview flow
- Bangla and English UI
- Hugging Face and OpenRouter cloud reasoning
- optional Supabase persistence
- current `/docs` page

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env` and fill values.

Minimum practical setup:

```env
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

OPENROUTER_API_KEY=...
OPENROUTER_API_KEY_FALLBACK=...

HF_TOKEN=...
HF_TOKEN_FALLBACK=...

OCR_SPACE_API_KEY=...
OCR_SPACE_API_KEY_FALLBACK=...
```

## 3. Optional database migrations

If you want Supabase persistence and vector support, run the project migrations in Supabase SQL Editor.

Typical order:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_vector_search.sql`
3. any later migration files needed by your branch history

Also ensure the `vector` extension is enabled if your migration path requires it.

## 4. Run the app

```bash
npm run dev:all
```

Or run separately:

```bash
npm run dev
npm run dev:api
```

Frontend:

- `http://localhost:5173`

API:

- `http://localhost:3001`

## 5. Verify key product flows

Recommended manual checks:

1. Upload `public/sample-inventory.csv`
2. Upload another CSV and confirm data adds instead of replacing
3. Open the supplier memo card and test a memo preview
4. Confirm inventory shows unit cost correctly
5. Ask Shop Analyzer a stock or festival question
6. Test Individual product analysis
7. Load weather advice for a city
8. Open `/docs` and verify live documentation loads

## 6. Optional checks

```bash
npm run build
npm run test:smoke
```

## 7. Pre-deployment reminder

Before Vercel deployment, mirror the same provider env vars there:

- `OPENROUTER_API_KEY`
- `OPENROUTER_API_KEY_FALLBACK`
- `HF_TOKEN`
- `HF_TOKEN_FALLBACK`
- `OCR_SPACE_API_KEY`
- `OCR_SPACE_API_KEY_FALLBACK`
