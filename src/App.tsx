import { useMemo, useState } from 'react'
import { DropZone } from './components/DropZone'
import { KeyDrawer } from './components/KeyDrawer'
import { CheckIcon, MoonIcon, SunIcon } from './components/Icons'
import { ProviderGrid } from './components/ProviderGrid'
import { ResultsTable } from './components/ResultsTable'
import { useChecker } from './hooks/useChecker'
import { exportCsv, exportJson, exportValidTxt } from './lib/exportResults'
import { filterRows, sortRows } from './lib/filterSort'
import { applyTheme, readTheme, writeTheme, type Theme } from './lib/theme'
import { getProvider } from './providers'
import type { KeyRow, SortDir, SortKey, StatusFilter } from './types'

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'valid', label: 'Valid' },
  { id: 'invalid', label: 'Invalid' },
  { id: 'rate_limited', label: 'Rate limited' },
  { id: 'quota_exceeded', label: 'Quota' },
  { id: 'forbidden', label: 'Forbidden' },
  { id: 'cors_blocked', label: 'CORS' },
  { id: 'network_error', label: 'Network' },
  { id: 'unknown_error', label: 'Unknown' },
]

export function App() {
  const checker = useChecker()
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = readTheme()
    applyTheme(initial)
    return initial
  })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('line')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<KeyRow | null>(null)
  const [includeFullKey, setIncludeFullKey] = useState(false)

  const provider = getProvider(checker.providerId)
  const busy = checker.runState === 'running' || checker.runState === 'paused'
  const progress = checker.stats.total === 0 ? 0 : Math.round((checker.stats.checked / checker.stats.total) * 100)

  const visible = useMemo(
    () => sortRows(filterRows(checker.rows, query, filter), sortKey, sortDir),
    [checker.rows, filter, query, sortDir, sortKey],
  )

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    writeTheme(next)
  }

  function onSort(next: SortKey) {
    if (sortKey === next) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(next)
      setSortDir(next === 'line' ? 'asc' : 'asc')
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark" aria-hidden="true">
            <CheckIcon width={22} height={22} />
          </div>
          <div>
            <h1>API Correct</h1>
            <p>Frontend-only authorized credential checker · GitHub Pages ready</p>
          </div>
        </div>
        <div className="top-actions">
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <section className="notice">
        <strong>Only test API credentials that you own or are explicitly authorized to test.</strong>
        <p>
          This is a static page. There is no backend, database, proxy, or analytics. Your .txt file is read in
          memory. Keys are sent only to the official {provider.name} API you select, and never placed in URLs,
          logs, or browser storage.
        </p>
      </section>

      <div className="layout">
        <DropZone
          parse={checker.parse}
          fileMeta={checker.fileMeta}
          error={checker.fileError}
          disabled={busy}
          onFile={(file) => void checker.loadFile(file)}
        />

        <div className="card">
          <ProviderGrid
            value={checker.providerId}
            onChange={checker.setProviderId}
            disabled={busy}
          />
          <p className="hint" style={{ marginTop: 10 }}>
            {provider.testEndpoint}. {provider.notes}
          </p>

          <div className="settings">
            <label className="setting">
              <header>
                <span>Concurrency</span>
                <b>{checker.concurrency}</b>
              </header>
              <input
                type="range"
                min={1}
                max={8}
                value={checker.concurrency}
                disabled={busy}
                onChange={(e) => checker.setConcurrency(Number(e.target.value))}
              />
            </label>
            <label className="setting">
              <header>
                <span>Delay between requests</span>
                <b>{checker.delayMs} ms</b>
              </header>
              <input
                type="range"
                min={0}
                max={1000}
                step={20}
                value={checker.delayMs}
                disabled={busy}
                onChange={(e) => checker.setDelayMs(Number(e.target.value))}
              />
            </label>
          </div>

          <label className="auth">
            <input
              type="checkbox"
              checked={checker.authorized}
              disabled={busy}
              onChange={(e) => checker.setAuthorized(e.target.checked)}
            />
            <span>I confirm I will only test credentials I own or am authorized to test.</span>
          </label>

          <div className="controls">
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !checker.parse?.entries.length ||
                !checker.authorized ||
                checker.runState === 'running' ||
                checker.runState === 'paused'
              }
              onClick={() => void checker.start()}
            >
              Start checking
            </button>
            <button type="button" className="btn" disabled={checker.runState !== 'running'} onClick={checker.pause}>
              Pause
            </button>
            <button type="button" className="btn" disabled={checker.runState !== 'paused'} onClick={checker.resume}>
              Resume
            </button>
            <button
              type="button"
              className="btn"
              disabled={checker.runState !== 'running' && checker.runState !== 'paused'}
              onClick={checker.stop}
            >
              Stop
            </button>
            <button type="button" className="btn btn-danger" onClick={checker.clearAll}>
              Clear everything
            </button>
          </div>
        </div>
      </div>

      {checker.corsBanner ? (
        <div className="banner" role="status">
          <strong>BROWSER BLOCKED — This provider cannot be verified directly from a static frontend.</strong>
          Remaining keys are marked CORS / BROWSER BLOCKED, not invalid. No backend or proxy is used to bypass this.
        </div>
      ) : null}

      <div className="progress">
        <div className="progress-top">
          <span>
            {checker.stats.checked} / {checker.stats.total} checked
            {checker.runState !== 'idle' ? ` · ${checker.runState}` : ''}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="bar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} role="progressbar">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="n">{checker.stats.total}</div>
          <div className="l">Total</div>
        </div>
        <div className="stat">
          <div className="n">{checker.stats.checked}</div>
          <div className="l">Checked</div>
        </div>
        <div className="stat valid">
          <div className="n">{checker.stats.valid}</div>
          <div className="l">Valid</div>
        </div>
        <div className="stat invalid">
          <div className="n">{checker.stats.invalid}</div>
          <div className="l">Invalid</div>
        </div>
        <div className="stat warn">
          <div className="n">{checker.stats.rateLimited}</div>
          <div className="l">Rate limit</div>
        </div>
        <div className="stat error">
          <div className="n">{checker.stats.error}</div>
          <div className="l">Error</div>
        </div>
      </div>

      <div className="stats-extra">
        <div className="stat warn">
          <div className="n">{checker.stats.quotaExceeded}</div>
          <div className="l">Quota</div>
        </div>
        <div className="stat">
          <div className="n">{checker.stats.forbidden}</div>
          <div className="l">Forbidden</div>
        </div>
        <div className="stat">
          <div className="n">{checker.stats.corsBlocked}</div>
          <div className="l">CORS blocked</div>
        </div>
        <div className="stat">
          <div className="n">{checker.stats.networkError}</div>
          <div className="l">Network</div>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search line, key, or detail"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip${filter === item.id ? ' is-on' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => exportCsv(visible, includeFullKey)}>
          Export CSV
        </button>
        <button type="button" className="btn" onClick={() => exportJson(visible, includeFullKey)}>
          Export JSON
        </button>
        <button type="button" className="btn" onClick={() => exportValidTxt(visible)}>
          Export valid TXT
        </button>
      </div>
      <label className="auth" style={{ marginTop: 0, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={includeFullKey}
          onChange={(e) => setIncludeFullKey(e.target.checked)}
        />
        <span>Include full keys in CSV/JSON export (they already exist in your local file).</span>
      </label>

      <ResultsTable
        rows={visible}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        onOpen={setSelected}
      />

      <footer className="footer">
        <span>No server · No env vars · No telemetry · Free GitHub Pages static hosting.</span>
        <span>
          VALID is only set after a real HTTP 2xx from {provider.name}. CORS failures are never marked invalid.
        </span>
      </footer>

      <KeyDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
