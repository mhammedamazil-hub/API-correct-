import type { ProviderAdapter } from './types'
import { performCheck } from './http'

export const anthropic: ProviderAdapter = {
  id: 'anthropic',
  name: 'Anthropic',
  shortName: 'Anthropic',
  docsUrl: 'https://docs.anthropic.com/en/api/models-list',
  keyHint: 'sk-ant-…',
  testEndpoint: 'GET https://api.anthropic.com/v1/models',
  notes: 'Lists models. Uses the official browser CORS opt-in header. No message tokens are consumed.',
  async test({ apiKey, signal, fetchFn }) {
    return performCheck({
      url: 'https://api.anthropic.com/v1/models',
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      signal,
      fetchFn,
    })
  },
}
