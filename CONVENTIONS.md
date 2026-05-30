# ShopSense AI — Codebase Conventions & Quality Guidelines

This document outlines the standard coding styles, folder conventions, and security rules of the ShopSense AI project, aligning with **Aider Coding Conventions**.

---

## 1. Project Organization
*   `src/components/`: Reusable React frontend interface components.
*   `src/lib/`: Local mathematical calculations, forecasting, graph building, and offline backup algorithms.
*   `server/lib/agents/`: Custom, lightweight JS multi-agent orchestrator files.
*   `server/lib/rag/`: Variable chunking, vector caches, and hybrid pgvector retrieval pipelines.
*   `supabase/migrations/`: Database structures, index configurations, and vector matching stored procedures.

## 2. Security & Credentials (No Leaks Policy)
*   All environment configurations must be cloned from `.env.example` to `.env`.
*   `.env` is ignored by git at all times.
*   Never use client-side environment prefixes (`VITE_`) for secrets (like `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY`). Secrets must reside strictly on the server-side memory.

## 3. Language & Framework Conventions
*   **Frontend**: Use functional React components with React hooks, TanStack React Query, and Tailwind CSS 4 utility layout selectors.
*   **Backend**: Use standard Node.js Express syntax with ESM imports (`.mjs` files). Keep routes stateless.
*   **Database**: Ensure indexes are created for all foreign-key lookups (e.g. `idx_sales_shop_date`).

## 4. Testing & Verification
*   Every feature must be verified against the local smoke test script:
    ```bash
    npm run test:smoke
    ```
*   The smoke test confirms Ollama, API endpoints, latency boundaries, and language scripts are fully operational.
