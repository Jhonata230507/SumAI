import 'server-only'

import { anthropic } from '@ai-sdk/anthropic'
import { generateText, streamText, type CoreMessage } from 'ai'
import { modelFor, MAX_TOKENS, type ModelTask } from './models'
import { assertSafeOutput, SAFETY_PREAMBLE } from './safety'

export interface GenerateOptions {
  task: ModelTask
  system: string
  messages: CoreMessage[]
  temperature?: number
}

/**
 * Single entry point for non-streaming model calls.
 * The safety preamble is prepended here rather than in each prompt file, so no
 * feature can accidentally ship without it.
 */
export async function generate({ task, system, messages, temperature = 0.3 }: GenerateOptions) {
  const { text, usage } = await generateText({
    model: anthropic(modelFor(task)),
    system: `${SAFETY_PREAMBLE}\n\n${system}`,
    messages,
    temperature,
    maxTokens: MAX_TOKENS[task],
  })

  assertSafeOutput(text)
  return { text, usage }
}

/** Streaming variant, for the chat surface. */
export function stream({ task, system, messages, temperature = 0.4 }: GenerateOptions) {
  return streamText({
    model: anthropic(modelFor(task)),
    system: `${SAFETY_PREAMBLE}\n\n${system}`,
    messages,
    temperature,
    maxTokens: MAX_TOKENS[task],
  })
}
