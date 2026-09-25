import { describe, expect, it } from 'vitest'
import { rowsFromEntries, runChecker } from '../engine/checker'
import { parseKeyFile } from '../lib/parseKeys'
import { computeStats } from '../lib/stats'
import type { ProviderAdapter } from '../providers/types'
import type { CheckStatus, RawCheck } from '../types'

function fakeProvider(impl: (key: string) => Promise<RawCheck> | RawCheck): ProviderAdapter {
  return {
    id: 'openai',
    name: 'OpenAI',
    shortName: 'OpenAI',
    docsUrl: '',
    keyHint: 'sk',
    testEndpoint: 'GET /fake',
    notes: '',
    async test({ apiKey }) {
      return impl(apiKey)
    },
  }
}

function gate() {
  let paused = false
  let resolve: (() => void) | null = null
  let promise: Promise<void> | null = null
  return {
    shouldPause: () => paused,
    pause() {
      paused = true
      promise = new Promise<void>((r) => {
        resolve = r
      })
    },
    resume() {
      paused = false
      resolve?.()
      promise = null
    },
    waitWhilePaused: async () => {
      while (paused) await (promise ?? Promise.resolve())
    },
  }
}

describe('runChecker', () => {
  it('checks unique keys once and copies the result onto duplicate lines', async () => {
    const parsed = parseKeyFile('good\nbad\ngood\n')
    const seen: string[] = []
    const patches: Array<{ line: number; status: CheckStatus }> = []
    const ctrl = new AbortController()

    await runChecker({
      entries: parsed.entries,
      provider: fakeProvider((key) => {
        seen.push(key)
        return { httpStatus: key === 'good' ? 200 : 401, bodyText: '{}' }
      }),
      concurrency: 2,
      delayMs: 0,
      maxRetries: 0,
      signal: ctrl.signal,
      shouldPause: () => false,
      waitWhilePaused: async () => undefined,
      onRows: (batch) => {
        for (const row of batch) patches.push({ line: row.line, status: row.status })
      },
      onCorsBlocked: () => undefined,
    })

    expect(seen).toEqual(['good', 'bad'])
    const finals = new Map<number, CheckStatus>()
    for (const patch of patches) finals.set(patch.line, patch.status)
    expect(finals.get(1)).toBe('valid')
    expect(finals.get(2)).toBe('invalid')
    expect(finals.get(3)).toBe('valid')
  })

  it('does not mark CORS as invalid', async () => {
    const parsed = parseKeyFile('k1\n')
    const finals: CheckStatus[] = []
    await runChecker({
      entries: parsed.entries,
      provider: fakeProvider(() => ({ corsBlocked: true })),
      concurrency: 1,
      delayMs: 0,
      maxRetries: 0,
      signal: new AbortController().signal,
      shouldPause: () => false,
      waitWhilePaused: async () => undefined,
      onRows: (batch) => {
        for (const row of batch) {
          if (row.status !== 'checking') finals.push(row.status)
        }
      },
      onCorsBlocked: () => undefined,
    })
    expect(finals).toEqual(['cors_blocked'])
  })

  it('honors pause before dispatching more work', async () => {
    const parsed = parseKeyFile('a\nb\n')
    const g = gate()
    g.pause()
    const started: string[] = []
    const ctrl = new AbortController()
    const done = runChecker({
      entries: parsed.entries,
      provider: fakeProvider((key) => {
        started.push(key)
        return { httpStatus: 200, bodyText: '{}' }
      }),
      concurrency: 1,
      delayMs: 0,
      maxRetries: 0,
      signal: ctrl.signal,
      shouldPause: g.shouldPause,
      waitWhilePaused: g.waitWhilePaused,
      onRows: () => undefined,
      onCorsBlocked: () => undefined,
    })

    await new Promise((r) => setTimeout(r, 40))
    expect(started).toEqual([])
    g.resume()
    await done
    expect(started).toEqual(['a', 'b'])
  })

  it('computes dashboard stats from original line rows', () => {
    const rows = rowsFromEntries(parseKeyFile('a\nb\na\n').entries).map((row, i) => ({
      ...row,
      status: (i === 1 ? 'invalid' : 'valid') as CheckStatus,
    }))
    const stats = computeStats(rows)
    expect(stats.total).toBe(3)
    expect(stats.valid).toBe(2)
    expect(stats.invalid).toBe(1)
    expect(stats.checked).toBe(3)
  })
})
