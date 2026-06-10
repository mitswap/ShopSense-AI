import { runReasoningTask } from '../runtime.mjs'

function inferTaskType(options = {}) {
  if (options.taskType) return options.taskType
  if (options.json && (options.maxTokens ?? 0) >= 500) return 'schema_mapping'
  return 'chat_answer'
}

export async function generateText(prompt, options = {}) {
  const taskType = inferTaskType(options)
  const result = await runReasoningTask({
    taskType,
    prompt,
    evidence: options.evidence ?? [],
    guards: {
      requireJson: Boolean(options.json),
    },
    reasoningPath: [`compat:${taskType}`],
  })

  return {
    text: result.text ?? '',
    provider: result.provider ?? 'none',
    model: result.model ?? null,
    error: result.ok ? null : result.validation?.errors?.join('; ') || 'No model output',
    reasoningPath: result.reasoningPath,
    confidence: result.confidence,
  }
}
