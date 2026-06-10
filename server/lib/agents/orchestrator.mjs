import { runInventoryAgent } from './inventoryAgent.mjs'
import { runSalesAgent } from './salesAgent.mjs'
import { runInsightAgent } from './insightAgent.mjs'

const TASK_AGENT_MAP = {
  chat_answer: ['sales', 'inventory', 'insight'],
  owner_advice: ['inventory', 'sales', 'insight'],
  root_cause: ['insight', 'sales', 'inventory'],
  graph_explainer: ['insight', 'sales'],
  alert_triage: ['inventory', 'insight'],
  forecast_explainer: ['sales', 'inventory'],
  weather_reasoning: ['inventory', 'sales'],
  schema_mapping: [],
}

const INTENT_RULES = [
  { intent: 'inventory', keywords: ['inventory', 'stock', 'reorder', 'dead'] },
  { intent: 'sales', keywords: ['sales', 'revenue', 'trend', 'top', 'best'] },
  { intent: 'forecast', keywords: ['forecast', 'demand'] },
  { intent: 'root_cause', keywords: ['why', 'explain', 'root', 'cause'] },
  { intent: 'festival', keywords: ['eid', 'festival'] },
  { intent: 'graph', keywords: ['graph', 'bundle', 'connection'] },
  { intent: 'weather', keywords: ['weather', 'rain', 'hot', 'cold'] },
]

function selectIntent(query, taskType) {
  const q = String(query ?? '').toLowerCase()
  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((keyword) => q.includes(keyword))) return rule.intent
  }
  if (taskType === 'owner_advice') return 'advice'
  if (taskType === 'root_cause') return 'root_cause'
  if (taskType === 'weather_reasoning') return 'weather'
  return 'general'
}

function resolveAgents(taskType, intent) {
  const base = TASK_AGENT_MAP[taskType] ?? TASK_AGENT_MAP.chat_answer
  if (intent === 'inventory') return ['inventory', 'sales', 'insight'].filter((a) => base.includes(a))
  if (intent === 'sales' || intent === 'forecast') return ['sales', 'inventory', 'insight'].filter((a) => base.includes(a))
  if (intent === 'root_cause' || intent === 'graph') return ['insight', 'sales', 'inventory'].filter((a) => base.includes(a))
  return base
}

function runAgent(name, ctx) {
  if (name === 'inventory') return runInventoryAgent(ctx)
  if (name === 'sales') return runSalesAgent(ctx)
  if (name === 'insight') return runInsightAgent(ctx)
  return null
}

export async function orchestrateReasoning({
  taskType = 'chat_answer',
  query = '',
  ctx = {},
}) {
  const intent = selectIntent(query, taskType)
  const agentNames = resolveAgents(taskType, intent)

  const outputs = agentNames
    .map((name) => runAgent(name, ctx))
    .filter(Boolean)

  const evidenceUsed = outputs.flatMap((output) =>
    Object.keys(output.evidence ?? {}).map((key) => `${output.agent}.${key}`),
  )

  const nextToolCalls = [...new Set(outputs.flatMap((output) => output.recommendedNextToolCalls ?? []))]

  return {
    taskType,
    intent,
    planner: {
      selectedAgents: agentNames,
      reason: `task:${taskType}|intent:${intent}`,
      nextToolCalls,
    },
    subtasks: agentNames.map((agent, index) => ({
      id: index + 1,
      task: query.slice(0, 140),
      agent,
    })),
    agentOutputs: outputs,
    evidenceUsed,
    confidence: outputs.length
      ? Number(
          (
            outputs.reduce((sum, output) => sum + (output.confidence ?? 0.7), 0) /
            outputs.length
          ).toFixed(2),
        )
      : 0.65,
    ragPipeline:
      intent === 'inventory'
        ? 'inventory'
        : intent === 'sales' || intent === 'forecast'
          ? 'sales'
          : intent === 'weather'
            ? 'weather'
            : 'general',
  }
}

export async function orchestrateQuery(query, ctx) {
  return orchestrateReasoning({ taskType: 'chat_answer', query, ctx })
}
