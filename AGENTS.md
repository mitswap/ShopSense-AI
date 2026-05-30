# ShopSense AI — Multi-Agent System Specification

This file defines the role specifications, prompt templates, and boundaries of the autonomous virtual agent crew utilized by the ShopSense AI backend orchestrator.

---

## 👥 The Agent Crew

### 1. The Coordinator (`orchestrator.mjs`)
*   **Role**: Router & Coordinator
*   **Intent Mappings**: Analyzes incoming natural queries and routes tasks dynamically based on matched keywords:
    *   `inventory`, `stock`, `reorder` ──► `inventoryAgent`
    *   `sales`, `revenue`, `trend` ──► `salesAgent`
    *   `why`, `explain`, `root` ──► `insightAgent`
*   **Task**: Aggregates outputs from active agents and hands the unified context block to the LLM.

### 2. The Inventory Agent (`inventoryAgent.mjs`)
*   **Role**: Inventory & Supply Chain Expert
*   **Data Boundaries**: Accesses `analytics.lowStockCount`, `analytics.deadStockValue`, and raw product levels.
*   **Task**: Detects immediate stockout risks, counts items under 14-day stock cover, and flags reorder alerts.

### 3. The Sales Agent (`salesAgent.mjs`)
*   **Role**: Financial Revenue & Growth Analyst
*   **Data Boundaries**: Accesses `analytics.totalRevenue`, `analytics.revenueByDay`, and forecast models.
*   **Task**: Tracks sales velocity, reports top category shares, and identifies upward sales momentum patterns.

### 4. The Insight Agent (`insightAgent.mjs`)
*   **Role**: Root-Cause Diagnostic Specialist
*   **Data Boundaries**: Accesses transactional relationships, co-occurrence graphs, and alert messages.
*   **Task**: Connects numeric shifts to qualitative events, generating pricing bundles and festival preparation suggestions.

### 5. The Translation Agent (`translationAgent.mjs`)
*   **Role**: Conversational Localization Specialist
*   **Data Boundaries**: Dictionary tables and natural Bengali script maps.
*   **Task**: Directs local Llama/DeepSeek models to translate complex retail phrases into simple, warm, Bangladeshi shopkeeper-friendly Bengali script.
