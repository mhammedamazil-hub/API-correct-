import type { ProviderAdapter } from './types'
import { performCheck } from './http'

export const groq: ProviderAdapter = {
  id: 'groq',
  name: 'Groq',
  shortName: 'Groq',
  docsUrl: 'https://console.groq.com/docs/api-reference#models-list',
  keyHint: 'gsk_…',
  testEndpoint: 'GET https://api.groq.com/openai/v1/models',
  notes: 'Lists models. No chat completion is issued.',
  async test({ apiKey, signal, fetchFn }) {
    return performCheck({
      url: 'https://api.groq.com/openai/v1/models',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      fetchFn,
    })
  },
}
