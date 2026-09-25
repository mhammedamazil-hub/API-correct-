import type { ProviderAdapter } from './types'
import { performCheck } from './http'

export const openrouter: ProviderAdapter = {
  id: 'openrouter',
  name: 'OpenRouter',
  shortName: 'OpenRouter',
  docsUrl: 'https://openrouter.ai/docs/api-reference/api-keys/get-current-api-key',
  keyHint: 'sk-or-…',
  testEndpoint: 'GET https://openrouter.ai/api/v1/key',
  notes: 'Reads current key metadata. Does not call a model.',
  async test({ apiKey, signal, fetchFn }) {
    return performCheck({
      url: 'https://openrouter.ai/api/v1/key',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      fetchFn,
    })
  },
}
