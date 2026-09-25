import type { ProviderAdapter } from './types'
import { performCheck } from './http'

export const gemini: ProviderAdapter = {
  id: 'gemini',
  name: 'Google Gemini',
  shortName: 'Gemini',
  docsUrl: 'https://ai.google.dev/api/models',
  keyHint: 'AIza…',
  testEndpoint: 'GET https://generativelanguage.googleapis.com/v1beta/models',
  notes: 'Lists models via x-goog-api-key. The key is never placed in the URL.',
  async test({ apiKey, signal, fetchFn }) {
    return performCheck({
      url: 'https://generativelanguage.googleapis.com/v1beta/models',
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
      signal,
      fetchFn,
    })
  },
}
