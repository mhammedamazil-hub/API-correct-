import { describe, expect, it } from 'vitest'
import { providerMap, providers } from '../providers'

describe('providers', () => {
  it('exposes the eight required adapters', () => {
    expect(providers.map((p) => p.id)).toEqual([
      'openai',
      'gemini',
      'anthropic',
      'groq',
      'openrouter',
      'mistral',
      'cohere',
      'together',
    ])
  })

  it('never puts Gemini keys in the URL', async () => {
    let requested = ''
    await providerMap.gemini.test({
      apiKey: 'AIza-secret-should-not-appear',
      signal: new AbortController().signal,
      fetchFn: async (input, init) => {
        requested = String(input)
        const headers = new Headers(init?.headers)
        expect(headers.get('x-goog-api-key')).toBe('AIza-secret-should-not-appear')
        expect(requested.includes('AIza-secret')).toBe(false)
        expect(requested.includes('key=')).toBe(false)
        return new Response('{"models":[]}', { status: 200 })
      },
    })
    expect(requested).toBe('https://generativelanguage.googleapis.com/v1beta/models')
  })

  it('sends Anthropic browser CORS opt-in header', async () => {
    let browserHeader = ''
    await providerMap.anthropic.test({
      apiKey: 'sk-ant-test',
      signal: new AbortController().signal,
      fetchFn: async (_input, init) => {
        browserHeader = new Headers(init?.headers).get('anthropic-dangerous-direct-browser-access') ?? ''
        return new Response('{"data":[]}', { status: 200 })
      },
    })
    expect(browserHeader).toBe('true')
  })

  it('maps Cohere valid:false onto HTTP 401 so it is not counted valid', async () => {
    const raw = await providerMap.cohere.test({
      apiKey: 'co-test',
      signal: new AbortController().signal,
      fetchFn: async () => new Response(JSON.stringify({ valid: false }), { status: 200 }),
    })
    expect(raw.httpStatus).toBe(401)
  })
})
