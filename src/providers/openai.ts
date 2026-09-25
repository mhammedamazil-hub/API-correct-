import type { ProviderAdapter } from './types'
import { performCheck } from './http'

export const openai: ProviderAdapter = {
  id: 'openai',
  name: 'OpenAI',
  shortName: 'OpenAI',
  docsUrl: 'https://platform.openai.com/docs/api-reference/models/list',
  keyHint: 'sk-…',
  testEndpoint: 'GET https://api.openai.com/v1/models',
  notes: 'Lists models. No completion tokens are consumed.',
  async test({ apiKey, signal, fetchFn }) {
    return performCheck({
      url: 'https://api.openai.com/v1/models',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      fetchFn,
    })
  },
}
