# ShopSense AI Conventions

This document defines the current coding, architecture, and documentation conventions for the ShopSense AI repository.

## 1. Product Principles

- Keep local and serverless behavior aligned whenever possible.
- Prefer shared source changes over environment-specific branching.
- Keep deterministic analytics as the grounding layer even when AI enrichment is enabled.
- Avoid UI-only claims that the backend cannot actually support.
- Review-before-write flows are preferred for risky inputs like memo OCR.

## 2. Repository Structure

- `src/`
  - Frontend app, pages, components, localization, and browser-side fallback logic.
- `server/`
  - Express handlers, AI runtime, OCR integration, docs routes, RAG logic, and shared server utilities.
- `api/`
  - Serverless entry for Vercel.
- `public/`
  - Static assets, sample CSVs, demo memo image, and logo assets.
- `data/docs/`
  - Saved live docs content and draft docs content.
- `supabase/migrations/`
  - Database schema and vector-related SQL.

## 3. Frontend Conventions

- Use React function components.
- Keep user-facing state transitions simple and explicit.
- Use `useState`, `useEffect`, `startTransition`, and existing project patterns before introducing new abstractions.
- Reuse the existing localization system in `src/locales/` and `src/lib/localeCopy.ts`.
- Keep Bangla mode consistent across visible UI labels, cards, and inventory naming where mappings exist.
- Avoid introducing new global state unless the current structure clearly needs it.

## 4. Backend Conventions

- Use ESM `.mjs` modules on the server side.
- Keep route handlers small and move reusable logic into `server/lib/`.
- Prefer provider integration changes inside centralized provider files instead of patching many handlers.
- Current provider entry points:
  - OpenRouter: `server/openrouter.mjs`
  - Hugging Face compatibility client: `server/lib/intelligence/llm/ollamaClient.mjs`
  - OCR.Space: `server/lib/memo/ocrSpace.mjs`
- Keep public routes stateless and request-driven.

## 5. Data and Analytics Conventions

- CSV imports are additive now. New uploads should merge into the existing dataset instead of replacing it unless explicitly reset.
- Supplier memo imports should preview rows first, then update inventory only after confirmation.
- `firstStockDate` is internal and should not be surfaced casually in the UI.
- Festival inference is computed from date windows and then consumed by analytics.
- Dead stock and slow mover logic should remain cycle-aware and not classify brand-new products too early.
- Keep `unitCost` and `unitPrice` semantics separate:
  - `unitCost` is acquisition cost
  - `unitPrice` is selling price

## 6. AI Runtime Conventions

- Deterministic business logic is the grounding layer.
- AI should enrich, explain, or format; it should not silently replace core computed analytics.
- The runtime currently supports:
  - Hugging Face
  - OpenRouter
  - optional local Ollama
- Provider keys now support primary and fallback env variables.
- Fallback behavior should remain centralized, lightweight, and parity-safe.

## 7. Environment and Secrets

- `.env` is local-only and must stay out of Git.
- Never store secrets in `VITE_*` variables.
- Use server-only env vars for:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_API_KEY_FALLBACK`
  - `HF_TOKEN`
  - `HF_TOKEN_FALLBACK`
  - `OCR_SPACE_API_KEY`
  - `OCR_SPACE_API_KEY_FALLBACK`
- Mirror the same env names in Vercel for deployment parity.

## 8. Documentation Conventions

- Repo docs should describe the current product, not historical experiments.
- `/docs` content is data-driven and must stay in sync with the actual shipped system.
- Update these together when product behavior changes materially:
  - `server/lib/docs/defaultContent.mjs`
  - `data/docs/content.json`
  - `data/docs/content.draft.json`
- Root markdown files should be GitHub-ready, concise, and accurate.

## 9. Verification

Use these checks after meaningful changes:

```bash
npm run build
npm run test:smoke
```

If a test cannot be run, state that clearly in the handoff.
