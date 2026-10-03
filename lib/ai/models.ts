/** Model routing. Cheap models handle short explanations; analysis gets the strong one. */

export const MODELS = {
  /** Long-form analysis, recommendations, multi-step reasoning over a result. */
  analysis: 'claude-opus-5-5',
  /** Conversational coaching, follow-up questions. */
  chat: 'claude-sonnet-5',
  /** One-paragraph term explanations. Latency matters more than depth. */
  explain: 'claude-haiku-4-5-20251001',
} as const

export type ModelTask = keyof typeof MODELS

export function modelFor(task: ModelTask): string {
  return process.env.AI_MODEL ?? MODELS[task]
}

export const MAX_TOKENS: Record<ModelTask, number> = {
  analysis: 2048,
  chat: 1024,
  explain: 512,
}
