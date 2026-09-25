import { classifyRaw, isRetryable, statusDetail } from '../lib/classify'
import { uniqueWorkItems } from '../lib/parseKeys'
import { scrubText } from '../lib/scrub'
import type { ProviderAdapter } from '../providers/types'
import type { FetchLike } from '../providers/types'
import type { CheckStatus, KeyRow, ParsedKey, RawCheck } from '../types'

export interface CheckerOptions {
  entries: ParsedKey[]
  provider: ProviderAdapter
  concurrency: number
  delayMs: number
  maxRetries: number
  fetchFn?: FetchLike
  signal: AbortSignal
  shouldPause: () => boolean
  waitWhilePaused: () => Promise<void>
  onRows: (patch: Array<{ line: number; status: CheckStatus; detail?: string; httpStatus?: number }>) => void
  onCorsBlocked: () => void
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
    }
    if (signal.aborted) {
      window.clearTimeout(timer)
      onAbort()
      return
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function backoffMs(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) return retryAfterMs
  const base = Math.min(1000 * 2 ** attempt, 8000)
  const jitter = Math.floor(Math.random() * 250)
  return base + jitter
}

function linesForKey(entries: ParsedKey[], key: string): number[] {
  return entries.filter((e) => e.key === key).map((e) => e.line)
}

async function checkOne(
  provider: ProviderAdapter,
  apiKey: string,
  signal: AbortSignal,
  fetchFn: FetchLike,
  maxRetries: number,
): Promise<{ status: CheckStatus; raw: RawCheck }> {
  let attempt = 0
  let last: { status: CheckStatus; raw: RawCheck } | undefined

  while (attempt <= maxRetries) {
    if (signal.aborted) {
      return { status: 'unknown_error', raw: { aborted: true } }
    }
    const raw = await provider.test({ apiKey, signal, fetchFn })
    if (raw.aborted) {
      return { status: 'unknown_error', raw }
    }
    const status = classifyRaw(raw)
    last = { status, raw }

    if (status === 'cors_blocked') return last
    if (status === 'valid' || status === 'invalid' || status === 'forbidden' || status === 'quota_exceeded') {
      return last
    }
    if (isRetryable(status) && attempt < maxRetries) {
      await sleep(backoffMs(attempt, raw.retryAfterMs), signal)
      attempt += 1
      continue
    }
    return last
  }

  return last ?? { status: 'unknown_error', raw: {} }
}

export async function runChecker(opts: CheckerOptions): Promise<void> {
  const fetchFn = opts.fetchFn ?? ((input, init) => fetch(input, init))
  const unique = uniqueWorkItems(opts.entries)
  const concurrency = Math.max(1, Math.min(opts.concurrency, 8))
  let cursor = 0
  let consecutiveCors = 0
  let shortCircuitCors = false

  const worker = async () => {
    while (true) {
      if (opts.signal.aborted) return
      if (opts.shouldPause()) {
        await opts.waitWhilePaused()
      }
      if (opts.signal.aborted) return

      const index = cursor
      cursor += 1
      if (index >= unique.length) return

      const item = unique[index]
      if (!item) return
      const affected = linesForKey(opts.entries, item.key)

      if (shortCircuitCors) {
        opts.onRows(
          affected.map((line) => ({
            line,
            status: 'cors_blocked' as const,
            detail: statusDetail('cors_blocked'),
          })),
        )
        continue
      }

      opts.onRows(
        affected.map((line) => ({
          line,
          status: 'checking' as const,
          detail: statusDetail('checking'),
        })),
      )

      try {
        const { status, raw } = await checkOne(
          opts.provider,
          item.key,
          opts.signal,
          fetchFn,
          opts.maxRetries,
        )

        if (opts.signal.aborted || raw.aborted) {
          opts.onRows(
            affected.map((line) => ({
              line,
              status: 'queued',
              detail: 'Stopped before a verdict.',
            })),
          )
          return
        }

        if (status === 'cors_blocked') {
          consecutiveCors += 1
          opts.onCorsBlocked()
          if (consecutiveCors >= 2) {
            shortCircuitCors = true
          }
        } else {
          consecutiveCors = 0
        }

        const detail = scrubText(statusDetail(status, raw.httpStatus), item.key)
        opts.onRows(
          affected.map((line) => ({
            line,
            status,
            detail,
            httpStatus: raw.httpStatus,
          })),
        )
      } catch (err) {
        if (opts.signal.aborted) {
          opts.onRows(
            affected.map((line) => ({
              line,
              status: 'queued',
              detail: 'Stopped before a verdict.',
            })),
          )
          return
        }
        const name = err instanceof Error ? err.name : 'Error'
        if (name === 'AbortError') {
          opts.onRows(
            affected.map((line) => ({
              line,
              status: 'queued',
              detail: 'Stopped before a verdict.',
            })),
          )
          return
        }
        opts.onRows(
          affected.map((line) => ({
            line,
            status: 'unknown_error' as const,
            detail: statusDetail('unknown_error'),
          })),
        )
      }

      if (opts.delayMs > 0 && !opts.signal.aborted) {
        try {
          await sleep(opts.delayMs, opts.signal)
        } catch {
          return
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, unique.length || 1) }, () => worker())
  await Promise.all(workers)
}

export function rowsFromEntries(entries: ParsedKey[]): KeyRow[] {
  return entries.map((entry) => ({
    id: `line-${entry.line}`,
    line: entry.line,
    key: entry.key,
    duplicateOfLine: entry.duplicateOfLine,
    status: 'queued',
    detail: entry.duplicateOfLine
      ? `Duplicate of line #${entry.duplicateOfLine}. Will inherit that result.`
      : statusDetail('queued'),
  }))
}
