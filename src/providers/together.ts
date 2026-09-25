import type { ProviderAdapter } from './types'
import { performCheck } from './http'

export const together: ProviderAdapter = {
  id: 'together',
  name: 'Together AI',
  shortName: 'Together',
  docsUrl: 'https://docs.together.ai/reference/models-1',
  keyHint: '…',
  testEndpoint: 'GET https://api.together.ai/v1/models',
  notes: 'Lists models. No inference request is sent.',
  async test({ apiKey, signal, fetchFn }) {
    return performCheck({
      url: 'https://api.together.ai/v1/models',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      fetchFn,
    })
  },
}
