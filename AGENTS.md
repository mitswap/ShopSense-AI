# ShopSense AI Agent and Runtime Notes

This file describes the current reasoning and task-routing model used by the ShopSense AI backend. It is a product architecture reference, not a promise that every named agent exists as an isolated file at all times.

## Runtime Philosophy

ShopSense AI uses a hybrid reasoning model:

- deterministic analytics for business facts
- task-based routing for AI-assisted explanation
- provider-level fallback across cloud models
- optional local compatibility with Ollama-style flows

The goal is grounded retail operations support, not free-form generic chat.

## Current Functional Roles

### 1. Coordinator

- Interprets request type
- Selects the right business context
- Routes to deterministic logic, AI enrichment, or both
- Keeps local/serverless behavior aligned as much as possible

### 2. Inventory Reasoning Layer

- Works with stock levels, reorder risk, low stock, slow movers, and dead stock
- Uses inventory-cycle-aware calculations such as `firstStockDate`
- Supports additive imports and memo-driven stock updates

### 3. Sales and Festival Reasoning Layer

- Uses revenue, quantity sold, forecast context, and inferred festival windows
- Supports questions like restocking near Eid or Puja
- Feeds product-level and festival-level insight into the Shop Analyzer and advice system

### 4. Root Cause / Product Analysis Layer

- Explains why a specific product changed in performance
- Combines computed context with AI output when available
- Uses the UI label `Individual product analysis`

### 5. Weather Reasoning Layer

- Provides today-specific advice for a shop city
- Helps connect weather context to likely winners, likely losers, and store actions

### 6. Localization Layer

- Supports Bangla and English UI and assistant-facing copy
- Uses translation and label mapping to reduce English leakage in Bangla mode

## Provider Routing

The current cloud/runtime stack supports:

- Hugging Face
- OpenRouter
- OCR.Space
- optional local Ollama compatibility

Primary and fallback keys now exist for:

- OpenRouter
- Hugging Face
- OCR.Space

This fallback logic is centralized in provider modules instead of spread across handlers.

## Important Boundaries

- Deterministic analytics remain the factual foundation.
- AI should explain and enrich, not replace computed business facts.
- OCR import must stay review-first before inventory write.
- Documentation should reflect the current runtime and product behavior.
