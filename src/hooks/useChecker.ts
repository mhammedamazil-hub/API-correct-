import { useCallback, useMemo, useRef, useState } from 'react'
import { rowsFromEntries, runChecker } from '../engine/checker'
import { parseKeyFile } from '../lib/parseKeys'
import { computeStats } from '../lib/stats'
import { getProvider } from '../providers'
import type { KeyRow, ParseResult, ProviderId, RunState } from '../types'

export interface FileMeta {
  name: string
  size: number
}

export function useChecker() {
  const [parse, setParse] = useState<ParseResult | null>(null)
  const [rows, setRows] = useState<KeyRow[]>([])
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [providerId, setProviderId] = useState<ProviderId>('openai')
  const [concurrency, setConcurrency] = useState(3)
  const [delayMs, setDelayMs] = useState(120)
  const [runState, setRunState] = useState<RunState>('idle')
  const [corsBanner, setCorsBanner] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  const runStateRef = useRef<RunState>('idle')
  const pausedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const pauseGate = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null)
  const pending = useRef<Map<number, Partial<KeyRow>>>(new Map())
  const raf = useRef<number>(0)

  const flush = useCallback(() => {
    raf.current = 0
    const batch = Array.from(pending.current.values())
    pending.current.clear()
    if (batch.length === 0) return
    setRows((prev) => {
      const next = prev.slice()
      const indexByLine = new Map(next.map((row, i) => [row.line, i]))
      for (const patch of batch) {
        if (patch.line === undefined) continue
        const i = indexByLine.get(patch.line)
        if (i === undefined) continue
        const current = next[i]
        if (!current) continue
        next[i] = {
          ...current,
          ...patch,
          checkedAt: Date.now(),
        }
      }
      return next
    })
  }, [])

  const queuePatches = useCallback(
    (patches: Array<{ line: number; status: KeyRow['status']; detail?: string; httpStatus?: number }>) => {
      for (const patch of patches) {
        pending.current.set(patch.line, patch)
      }
      if (!raf.current) {
        raf.current = requestAnimationFrame(flush)
      }
    },
    [flush],
  )

  const loadFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase()
    const isTxt = name.endsWith('.txt') || file.type === 'text/plain'
    if (!isTxt) {
      setFileError('Please upload a .txt file with one key per line.')
      return
    }
    setFileError(null)
    abortRef.current?.abort()
    pausedRef.current = false
    setRunState('idle')
    runStateRef.current = 'idle'
    setCorsBanner(false)

    const text = await file.text()
    const parsed = parseKeyFile(text)
    const nextRows = rowsFromEntries(parsed.entries)
    setParse(parsed)
    setRows(nextRows)
    setFileMeta({ name: file.name, size: file.size })
  }, [])

  const clearAll = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    pausedRef.current = false
    pauseGate.current?.resolve()
    pauseGate.current = null
    pending.current.clear()
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
    setParse(null)
    setRows([])
    setFileMeta(null)
    setFileError(null)
    setRunState('idle')
    runStateRef.current = 'idle'
    setCorsBanner(false)
    setAuthorized(false)
  }, [])

  const start = useCallback(async () => {
    if (!parse || parse.entries.length === 0) return
    if (!authorized) return
    if (runStateRef.current === 'running') return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    pausedRef.current = false
    pauseGate.current?.resolve()
    pauseGate.current = null
    setCorsBanner(false)

    const reset = rowsFromEntries(parse.entries)
    setRows(reset)
    setRunState('running')
    runStateRef.current = 'running'

    try {
      await runChecker({
        entries: parse.entries,
        provider: getProvider(providerId),
        concurrency,
        delayMs,
        maxRetries: 2,
        signal: ctrl.signal,
        shouldPause: () => pausedRef.current,
        waitWhilePaused: async () => {
          while (pausedRef.current && !ctrl.signal.aborted) {
            await (pauseGate.current?.promise ?? Promise.resolve())
          }
        },
        onRows: queuePatches,
        onCorsBlocked: () => setCorsBanner(true),
      })
      if (ctrl.signal.aborted) {
        setRunState('stopped')
        runStateRef.current = 'stopped'
      } else {
        setRunState('done')
        runStateRef.current = 'done'
      }
    } catch {
      if (ctrl.signal.aborted) {
        setRunState('stopped')
        runStateRef.current = 'stopped'
      } else {
        setRunState('done')
        runStateRef.current = 'done'
      }
    } finally {
      if (raf.current) {
        cancelAnimationFrame(raf.current)
        flush()
      }
    }
  }, [authorized, concurrency, delayMs, flush, parse, providerId, queuePatches])

  const pause = useCallback(() => {
    if (runStateRef.current !== 'running') return
    if (!pauseGate.current) {
      let resolve = () => {}
      const promise = new Promise<void>((r) => {
        resolve = r
      })
      pauseGate.current = { promise, resolve }
    }
    pausedRef.current = true
    setRunState('paused')
    runStateRef.current = 'paused'
  }, [])

  const resume = useCallback(() => {
    if (runStateRef.current !== 'paused') return
    pausedRef.current = false
    pauseGate.current?.resolve()
    pauseGate.current = null
    setRunState('running')
    runStateRef.current = 'running'
  }, [])

  const stop = useCallback(() => {
    pausedRef.current = false
    pauseGate.current?.resolve()
    pauseGate.current = null
    abortRef.current?.abort()
    setRunState('stopped')
    runStateRef.current = 'stopped'
  }, [])

  const stats = useMemo(() => computeStats(rows), [rows])

  return {
    parse,
    rows,
    fileMeta,
    fileError,
    providerId,
    setProviderId,
    concurrency,
    setConcurrency,
    delayMs,
    setDelayMs,
    runState,
    corsBanner,
    authorized,
    setAuthorized,
    stats,
    loadFile,
    clearAll,
    start,
    pause,
    resume,
    stop,
  }
}
