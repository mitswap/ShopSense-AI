import { runInventoryAgent } from './inventoryAgent.mjs'
import { runSalesAgent } from './salesAgent.mjs'
import { runInsightAgent } from './insightAgent.mjs'

const INTENT_AGENTS = {
  inventory: ['inventory'],
  stock: ['inventory'],
  reorder: ['inventory'],
  sales: ['sales'],
  revenue: ['sales'],
  trend: ['sales'],
  forecast: ['sales', 'inventory'],
  explain: ['insight'],
  why: ['insight'],
  root: ['insight'],
  default: ['sales', 'inventory', 'insight'],
}

function matchIntent(query) {
  const q = query.toLowerCase()
  for (const [key, agents] of Object.entries(INTENT_AGENTS)) {
    if (key !== 'default' && q.includes(key)) return { intent: key, agents }
  }
  return { intent: 'general', agents: INTENT_AGENTS.default }
}

/**
 * Agent orchestrator — subtasks, tool routing, agent outputs.
 */
export async function orchestrateQuery(query, ctx) {
  const { intent, agents: agentNames } = matchIntent(query)

  const subtasks = agentNames.slice(0, 3).map((agent, i) => ({
    id: i + 1,
    task: query.slice(0, 120),
    agent,
  }))

  const outputs = []
  for (const name of agentNames) {
    if (name === 'inventory') outputs.push(runInventoryAgent(ctx))
    if (name === 'sales') outputs.push(runSalesAgent(ctx))
    if (name === 'insight') outputs.push(runInsightAgent(ctx))
  }

  return {
    intent,
    subtasks,
    agentOutputs: outputs,
    ragPipeline:
      intent === 'inventory'
        ? 'inventory'
        : intent === 'sales' || intent === 'revenue'
          ? 'sales'
          : 'general',
  }
}
