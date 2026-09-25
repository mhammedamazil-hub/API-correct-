import { describe, expect, it } from 'vitest'
import { maskKey } from '../lib/maskKey'
import { scrubText } from '../lib/scrub'

describe('maskKey and scrub', () => {
  it('masks long keys without returning the middle', () => {
    const key = 'sk-proj-abcdefghijklmnopqrstuvwxyz1234'
    const masked = maskKey(key)
    expect(masked.startsWith('sk-proj-')).toBe(true)
    expect(masked.endsWith('1234')).toBe(true)
    expect(masked.includes('mnopqr')).toBe(false)
  })

  it('redacts keys and query tokens', () => {
    const key = 'AIzaSyDummyKeyValue0001'
    const dirty = `Bearer ${key} https://example.com/?key=${key}`
    const clean = scrubText(dirty, key)
    expect(clean.includes(key)).toBe(false)
    expect(clean).toContain('[redacted]')
  })
})
