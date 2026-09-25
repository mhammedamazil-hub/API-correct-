import { describe, expect, it } from 'vitest'
import { classifyRaw } from '../lib/classify'

describe('classifyRaw', () => {
  it('marks 2xx as valid', () => {
    expect(classifyRaw({ httpStatus: 200, bodyText: '{"data":[]}' })).toBe('valid')
  })

  it('never treats CORS or network as invalid', () => {
    expect(classifyRaw({ corsBlocked: true })).toBe('cors_blocked')
    expect(classifyRaw({ networkError: true })).toBe('network_error')
    expect(classifyRaw({ timedOut: true })).toBe('network_error')
  })

  it('classifies auth failures as invalid', () => {
    expect(classifyRaw({ httpStatus: 401, bodyText: '{"error":"Incorrect API key provided"}' })).toBe('invalid')
    expect(
      classifyRaw({ httpStatus: 400, bodyText: '{"error":{"message":"API key not valid","status":"API_KEY_INVALID"}}' }),
    ).toBe('invalid')
  })

  it('classifies 429 as rate limited unless quota language is present', () => {
    expect(classifyRaw({ httpStatus: 429, bodyText: 'Too many requests' })).toBe('rate_limited')
    expect(classifyRaw({ httpStatus: 429, bodyText: '{"error":{"code":"insufficient_quota"}}' })).toBe('quota_exceeded')
  })

  it('classifies 403 as forbidden unless the body says the key is bad', () => {
    expect(classifyRaw({ httpStatus: 403, bodyText: 'country not supported' })).toBe('forbidden')
    expect(classifyRaw({ httpStatus: 403, bodyText: 'invalid api key' })).toBe('invalid')
  })

  it('treats Cohere valid:false as invalid even on HTTP 200', () => {
    expect(classifyRaw({ httpStatus: 200, bodyText: '{"valid":false}' })).toBe('invalid')
  })
})
