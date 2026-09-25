import { clipBody } from '../lib/scrub'
import type { RawCheck } from '../types'
import type { FetchLike } from './types'

const DEFAULT_TIMEOUT_MS = 20_000

export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, 60_000)
  }
  const when = Date.parse(header)
  if (!Number.isNaN(when)) {
    return Math.min(Math.max(when - Date.now(), 0), 60_000)
  }
  return undefined
}

function withTimeout(signal: AbortSignal | undefined, ms: number): {
  signal: AbortSignal
  cleanup: () => void
} {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(new DOMException('Timeout', 'TimeoutError')), ms)

  const onAbort = () => {
    ctrl.abort(signal?.reason)
  }
  signal?.addEventListener('abort', onAbort)

  if (signal?.aborted) {
    ctrl.abort(signal.reason)
  }

  return {
    signal: ctrl.signal,
    cleanup: () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    },
  }
}

function isAbort(err: unknown): boolean {
  if (err instanceof DOMException) {
    return err.name === 'AbortError' || err.name === 'TimeoutError'
  }
  if (err instanceof Error) {
    return err.name === 'AbortError' || err.name === 'TimeoutError'
  }
  return false
}

function isTimeout(err: unknown): boolean {
  if (err instanceof DOMException) return err.name === 'TimeoutError'
  if (err instanceof Error) return err.name === 'TimeoutError' || /timeout/i.test(err.message)
  return false
}

async function probeHostReachable(
  targetUrl: string,
  fetchFn: FetchLike,
  signal: AbortSignal,
): Promise<'reachable' | 'offline'> {
  try {
    const origin = new URL(targetUrl).origin
    await fetchFn(origin + '/', {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal,
    })
    return 'reachable'
  } catch {
    return 'offline'
  }
}

export interface PerformOptions {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
  signal: AbortSignal
  fetchFn: FetchLike
  timeoutMs?: number
  /** Test hook — skip CORS probe */
  skipCorsProbe?: boolean
}

export async function performCheck(opts: PerformOptions): Promise<RawCheck> {
  const { cleanup, signal } = withTimeout(opts.signal, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const response = await opts.fetchFn(opts.url, {
      method: opts.method ?? 'GET',
      headers: opts.headers,
      body: opts.body,
      signal,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      mode: 'cors',
      redirect: 'follow',
    })

    const bodyText = clipBody(await response.text())
    const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'))

    return {
      httpStatus: response.status,
      bodyText,
      retryAfterMs,
    }
  } catch (err) {
    if (isAbort(opts.signal) || opts.signal.aborted) {
      return { aborted: true }
    }
    if (isTimeout(err)) {
      return { timedOut: true, networkError: true }
    }
    if (isAbort(err)) {
      return { aborted: true }
    }

    const online =
      typeof navigator === 'undefined' ? true : navigator.onLine !== false
    if (!online) {
      return { networkError: true }
    }

    if (opts.skipCorsProbe) {
      return { networkError: true }
    }

    const reach = await probeHostReachable(opts.url, opts.fetchFn, opts.signal)
    if (reach === 'reachable') {
      return { corsBlocked: true }
    }
    return { networkError: true }
  } finally {
    cleanup()
  }
}
