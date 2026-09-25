import type { ProviderAdapter } from './types'
import { performCheck } from './http'

export const mistral: ProviderAdapter = {
  id: 'mistral',
  name: 'Mistral',
  shortName: 'Mistral',
  docsUrl: 'https://docs.mistral.ai/api/#tag/models',
  keyHint: '…',
  testEndpoint: 'GET https://api.mistral.ai/v1/models',
  notes: 'Lists models available to the key. No chat tokens are consumed.',
  async test({ apiKey, signal, fetchFn }) {
    return performCheck({
      url: 'https://api.mistral.ai/v1/models',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      fetchFn,
    })
  },
}
