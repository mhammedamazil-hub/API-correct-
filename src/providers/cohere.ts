import type { ProviderAdapter } from './types'
import { performCheck } from './http'

export const cohere: ProviderAdapter = {
  id: 'cohere',
  name: 'Cohere',
  shortName: 'Cohere',
  docsUrl: 'https://docs.cohere.com/reference/check-api-key',
  keyHint: '…',
  testEndpoint: 'POST https://api.cohere.com/v1/check-api-key',
  notes: 'Official key-check endpoint. Does not generate content.',
  async test({ apiKey, signal, fetchFn }) {
    const raw = await performCheck({
      url: 'https://api.cohere.com/v1/check-api-key',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal,
      fetchFn,
    })

    if (raw.httpStatus && raw.httpStatus >= 200 && raw.httpStatus < 300 && raw.bodyText) {
      try {
        const parsed = JSON.parse(raw.bodyText) as { valid?: boolean }
        if (parsed.valid === false) {
          return { ...raw, httpStatus: 401 }
        }
      } catch {
        /* keep original */
      }
    }
    return raw
  },
}
