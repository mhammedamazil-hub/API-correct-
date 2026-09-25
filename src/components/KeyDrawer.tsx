import { useEffect, useState } from 'react'
import { copyText } from '../lib/copy'
import { maskKey, statusLabel, statusSymbol } from '../lib/maskKey'
import type { KeyRow } from '../types'
import { CloseIcon, CopyIcon } from './Icons'

interface Props {
  row: KeyRow | null
  onClose: () => void
}

export function KeyDrawer({ row, onClose }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setRevealed(false)
    setCopied(false)
  }, [row?.id])

  if (!row) return null

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Key details"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="topbar" style={{ marginBottom: 8 }}>
          <div>
            <h2 style={{ margin: 0 }}>Line #{row.line}</h2>
            <p className="hint">
              {statusSymbol(row.status)} {statusLabel(row.status)}
              {row.httpStatus ? ` · HTTP ${row.httpStatus}` : ''}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <p className="hint">{row.detail}</p>
        {row.duplicateOfLine ? <p className="hint">Duplicate of line #{row.duplicateOfLine}.</p> : null}

        <div className="full-key">{revealed ? row.key : maskKey(row.key)}</div>

        <div className="drawer-actions">
          {!revealed ? (
            <button type="button" className="btn btn-primary" onClick={() => setRevealed(true)}>
              Show full key
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => setRevealed(false)}>
              Hide
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={async () => {
              const ok = await copyText(row.key)
              setCopied(ok)
            }}
          >
            <CopyIcon /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="hint" style={{ marginTop: 14 }}>
          The complete credential lives in browser memory only. It is not written to the URL, logs, or storage.
        </p>
      </aside>
    </div>
  )
}
