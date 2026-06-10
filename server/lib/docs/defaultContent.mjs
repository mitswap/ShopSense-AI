/** Default ShopSense AI documentation + YC pitch deck content */
export function buildDefaultDocsContent() {
  const version = '1.2.0'
  const updatedAt = new Date().toISOString()

  return {
    meta: {
      version,
      updatedAt,
      title: 'ShopSense AI by GremlinMonks',
      tagline: 'AI copilot for Bangladesh SME retail · BuildFest 2026',
    },
    pitch: {
      problem:
        'Small apparel shops in Bangladesh still run on spreadsheets, supplier memos, and memory. Owners struggle to organize incoming stock, track festival demand, understand sales drops, and react before cash flow is damaged.',
      solution:
        'ShopSense AI turns CSVs and supplier memos into a live retail operating system: additive data ingest, memo OCR, KPI dashboards, festival-aware analytics, Bengali-first shop Q&A, root-cause reasoning, and inventory actions built for non-technical shop owners.',
      whyNow:
        'Affordable cloud LLMs, OCR APIs, and browser-first analytics make practical AI retail operations possible for SMEs without ERP budgets, internal data teams, or complex software training.',
      demo:
        'Upload existing CSV data or a supplier memo image → review extracted rows → open live inventory and analytics → ask “How much should I reorder for Eid?” → receive grounded answers, advice, and product-level root cause reasoning.',
      market:
        '500k+ apparel SMEs in Bangladesh are an immediate beachhead, with the same workflow extendable to grocery, pharmacy, footwear, and regional distributor-led retail networks.',
      businessModel:
        'Freemium for basic analytics and inventory visibility, Pro for richer advice and branch operations, and future B2B intelligence products for suppliers, distributors, and multi-branch retailers.',
      traction:
        'BuildFest 2026 product-ready prototype with live docs, additive CSV imports, supplier memo OCR, weather advice, festival analytics, bilingual UI, and AI-native reasoning backed by Hugging Face and OpenRouter.',
      competition:
        'Generic BI tools are too technical, spreadsheets remain manual and reactive, and international ERP systems are too expensive and not localized for Bangla-speaking retail owners.',
      advantage:
        'CSV-first onboarding, memo-to-inventory OCR, Bangla-ready interface, festival-aware reasoning, dataset-grounded answers, and provider-fallback AI infrastructure make ShopSense much more deployable for real SME shops.',
      gtm:
        'Start with Dhaka and Sylhet apparel retailers, demonstrate memo upload plus Eid restock planning, expand through Facebook merchant groups and supplier relationships, then grow into multi-branch retail operations.',
      vision:
        'Every neighborhood shop should operate with the clarity, speed, and discipline of a modern retail chain—locally, affordably, and in the owner’s own workflow.',
    },
    team: {
      teamName: 'GremlinMonks — BuildFest 2026',
      members: [
        {
          id: '1',
          fullName: 'Susmit Debnath Swapnil',
          role: 'Team Leader / Project Coordinator · Backend & Database Engineer',
          email: '2022331067@student.sust.edu',
          photoUrl: '/team/Susmit.png',
        },
        {
          id: '2',
          fullName: 'Shimul Das',
          role: 'Business Analyst / Data Scientist · Backend & Database Engineer',
          email: 'shimuldas1023@gmail.com',
          photoUrl: '/team/Shimul.jpg',
        },
        {
          id: '3',
          fullName: 'Dipok Debnath',
          role: 'UI/UX · Frontend Developer',
          email: 'thelearnpoke@gmail.com',
          photoUrl: '/team/Dipok.png',
        },
        {
          id: '4',
          fullName: 'Maheya Jannat Nilima',
          role: 'Presentation & Communication Lead',
          email: 'maheyajannatnilima27@gmail.com',
          photoUrl: '/team/Nilima.jpg',
        },
        {
          id: '5',
          fullName: 'Mahmud Hasan Alek',
          role: 'UI/UX · Frontend Developer',
          email: 'mahmudhasanalek@gmail.com',
          photoUrl: '/team/Alek.jpg',
        },
      ],
    },
    product: {
      summary:
        'ShopSense AI is an SME retail copilot that ingests business data, supplier memos, and manual inventory updates to produce grounded analytics, reorder decisions, owner advice, and bilingual AI assistance.',
      users: ['Apparel shop owners', 'Inventory managers', 'Retail operators', 'Hackathon judges / investors via /docs'],
      useCases: [
        'Import and merge business data without replacing existing records',
        'Extract supplier memo rows into inventory with human review',
        'Detect low stock, slow movers, and dead stock more realistically',
        'Plan Eid and Puja restocking from historical festival behavior',
        'Ask natural-language questions about stock, sales, or inventory actions',
        'Understand why a specific product changed in sales performance',
        'Get today-specific weather advice for store action and product focus',
      ],
    },
    features: [
      { id: 'csv', name: 'Adaptive CSV ingest', status: 'live', description: 'Schema detection, flexible mapping, and additive imports' },
      { id: 'memo', name: 'Supplier memo import', status: 'live', description: 'OCR preview, row review, and confirm-before-update workflow' },
      { id: 'inventory', name: 'Live inventory operations', status: 'live', description: 'Manual add product, stock updates, unit cost tracking, and memo-driven stock merge' },
      { id: 'kpi', name: 'KPI dashboard', status: 'live', description: 'Sales, profit, growth, best seller, low stock, and dead stock visibility' },
      { id: 'forecast', name: 'Festival-aware forecast', status: 'live', description: 'Forecasting and reorder signals with inferred Eid and Puja windows' },
      { id: 'insight', name: 'Owner advice (3 actions)', status: 'live', description: 'Grounded discount, reorder, and shop action recommendations' },
      { id: 'nl', name: 'Shop Analyzer', status: 'live', description: 'Chat-style natural language Q&A over uploaded shop data' },
      { id: 'root', name: 'Individual product analysis', status: 'live', description: 'Per-product sales change explanation and recommended actions' },
      { id: 'weather', name: 'Weather advice', status: 'live', description: 'Today-specific weather reasoning for city-level shop planning' },
      { id: 'rag', name: 'Vector RAG knowledge', status: 'live', description: 'Hybrid retrieval with seeded knowledge chunks' },
      { id: 'graph', name: 'Knowledge graph view', status: 'live', description: 'Product, category, and festival relationship visualization' },
      { id: 'bn', name: 'Bengali localization', status: 'live', description: 'Bangla UI, labels, and localized assistant-facing copy' },
      { id: 'multi', name: 'Multi-branch operations', status: 'planned', description: 'Branch-aware inventory and analytics across locations' },
    ],
    architectureMermaid: `flowchart TB
  subgraph Client
    UI[React SPA on Vercel]
    Docs["/docs live pitch + technical docs"]
  end
  subgraph API
    Express[Express API]
    Routes[Analytics, NL, Root Cause, Weather, OCR Preview]
  end
  subgraph Intelligence
    Runtime[AI-native runtime router]
    HF[Hugging Face primary/fallback]
    OR[OpenRouter primary/fallback]
    Rules[Deterministic analytics + insight engines]
    OCR[OCR.Space primary/fallback]
  end
  subgraph Data
    LS[localStorage demo mode]
    SB[(Supabase optional persistence)]
    RAG[(Knowledge chunks / pgvector)]
  end
  UI -->|/api| Express
  Express --> Routes
  Routes --> Runtime
  Runtime --> HF
  Runtime --> OR
  Routes --> OCR
  Routes --> Rules
  Routes --> SB
  Routes --> RAG
  UI --> LS
  Docs --> Express`,
    dataFlowMermaid: `flowchart LR
  CSV[Business CSV Upload] --> Detect[Schema detect + canonical mapping]
  Memo[Supplier Memo Image/PDF] --> OCR[OCR preview + row review]
  Detect --> Merge[Additive merge into shop dataset]
  OCR --> Merge
  Manual[Manual product add] --> Merge
  Merge --> Store[(Products + Sales + row count)]
  Store --> Analytics[Analytics engine]
  Analytics --> Health[Low stock / slow movers / dead stock]
  Analytics --> Festival[Festival inference + festival analytics]
  Analytics --> Advice[Owner advice]
  Analytics --> Weather[Weather advice context]
  Store --> NL[Shop Analyzer]
  UserQ[Owner question] --> NL
  NL --> Answer[Grounded answer]
  Analytics --> Root[Individual product analysis]
  RAGkb[Knowledge chunks] --> RAG[Hybrid retrieval]
  RAG --> Runtime[Optional AI enrichment]`,
    stack: {
      frontend: ['React 19', 'Vite 8', 'TypeScript', 'Tailwind CSS 4', 'Recharts', 'TanStack Query'],
      backend: ['Express 5 API', 'Vercel-hosted frontend', 'Shared local/serverless source paths'],
      database: ['Supabase Postgres', 'pgvector', 'localStorage demo mode'],
      ai: [
        'Hugging Face Inference Providers',
        'OpenRouter chat + embeddings',
        'Optional local Ollama runtime',
        'OCR.Space for memo extraction',
        'Deterministic analytics and rule-based guardrails',
      ],
      infra: ['Vercel (frontend)', 'Render or local Express API', 'Supabase optional persistence', 'Provider key fallback support'],
    },
    apis: {
      exposed: [
        { method: 'GET', path: '/api/status', auth: 'Public', description: 'System layer health and provider availability' },
        { method: 'POST', path: '/api/insight', auth: 'App session', description: 'Owner advice JSON' },
        { method: 'POST', path: '/api/query/nl', auth: 'App session', description: 'Shop Analyzer Q&A' },
        { method: 'POST', path: '/api/root-cause', auth: 'App session', description: 'Individual product analysis' },
        { method: 'POST', path: '/api/weather/advice', auth: 'App session', description: 'Today-specific weather reasoning for the shop city' },
        { method: 'POST', path: '/api/schema/detect', auth: 'App session', description: 'CSV column mapping and detection' },
        { method: 'POST', path: '/api/memo/preview', auth: 'App session', description: 'Supplier memo OCR preview and row extraction' },
        { method: 'POST', path: '/api/rag/search', auth: 'Internal', description: 'Hybrid retrieval for seeded knowledge' },
        { method: 'GET', path: '/api/docs/*', auth: 'Public / Admin', description: 'Documentation system' },
      ],
      external: [
        { name: 'Hugging Face', use: 'Primary/fallback cloud reasoning and chat completions' },
        { name: 'OpenRouter', use: 'Primary/fallback cloud reasoning plus embeddings' },
        { name: 'OCR.Space', use: 'Supplier memo OCR with multi-engine retries' },
        { name: 'Supabase', use: 'Persistent storage and optional vector knowledge base' },
      ],
    },
    dataLayer: {
      sources: ['CSV upload (PapaParse)', 'Supplier memo OCR rows', 'Manual product entry', 'Optional Supabase sync'],
      processing: ['Schema detection', 'Canonical mapping', 'Festival inference', 'Additive inventory merge', 'Cycle-aware stock health logic'],
      storage: ['Per-user localStorage key', 'Supabase shops/products/sales tables', 'Internal first stock dates and unit costs'],
      privacy: 'Demo mode keeps core shop data in-browser; server-side secrets remain backend-only and production should enforce strong RLS and audit practices.',
    },
    aiLayer: {
      models: [
        'Hugging Face Qwen-class chat models for fast reasoning',
        'OpenRouter Qwen/OpenAI/Gemini-class model routing for fallback and embeddings',
        'Optional Ollama local runtime for compatible deployments',
      ],
      runtime: 'Task-based provider routing with deterministic fallbacks and provider/key retry order',
      rag: 'Hybrid vector + keyword retrieval over seeded knowledge chunks',
      personalization: 'Per-shop products, sales, festival patterns, and inventory state shape every answer',
      explainability: 'Rules and computed analytics remain first-class so AI responses stay grounded instead of generic',
    },
    roadmap: {
      short: ['Multi-branch selection flow', 'Supplier memo template library', 'Exportable inventory and advice reports'],
      mid: ['Supplier purchase order workflow', 'WhatsApp alerting', 'Branch comparison analytics'],
      long: ['Distributor intelligence layer', 'Credit and demand scoring', 'Regional retail operating network'],
    },
    performance: {
      load: 'Single-shop CSV and memo workflow is optimized for quick dashboard setup, with rule-first analytics and lightweight AI calls.',
      strategy: 'Shared source parity, provider fallback, additive imports, lazy chart rendering, and review-before-write memo flow keep the product responsive and safer for demos and deployment.',
    },
    security: {
      auth: 'Demo owner login for current product, with docs admin separated from app user flow',
      rbac: 'owner / admin / super_admin roles are respected for docs admin access',
      data: 'Service role keys stay server-only, and provider credentials are isolated in environment variables with primary/fallback support',
    },
    analytics: {
      kpis: ['Time-to-insight after upload', 'Memo-to-inventory confirmation completion', 'Low-stock detection quality', 'Festival restock recommendation usefulness', '/docs unique visitors'],
    },
    changelog: [
      { version: '1.2.0', date: updatedAt.slice(0, 10), notes: 'Added supplier memo OCR, additive import flow, weather advice, improved festival analytics, Bangla cleanup, and provider key fallback support' },
      { version: '1.1.0', date: '2026-06-10', notes: 'Improved slow mover and dead stock realism, added inventory cycle dates, and upgraded shop analyzer chat UI' },
      { version: '1.0.0', date: '2026-05-27', notes: 'Initial /docs module with pitch deck, tech docs, and access control' },
    ],
    customSections: [],
  }
}
