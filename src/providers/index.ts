import type { ProviderId } from '../types'
import type { ProviderAdapter } from './types'
import { openai } from './openai'
import { gemini } from './gemini'
import { anthropic } from './anthropic'
import { groq } from './groq'
import { openrouter } from './openrouter'
import { mistral } from './mistral'
import { cohere } from './cohere'
import { together } from './together'

export const providers: ProviderAdapter[] = [
  openai,
  gemini,
  anthropic,
  groq,
  openrouter,
  mistral,
  cohere,
  together,
]

export const providerMap: Record<ProviderId, ProviderAdapter> = {
  openai,
  gemini,
  anthropic,
  groq,
  openrouter,
  mistral,
  cohere,
  together,
}

export function getProvider(id: ProviderId): ProviderAdapter {
  return providerMap[id]
}
