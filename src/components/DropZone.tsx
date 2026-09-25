import { useCallback, useRef, useState } from 'react'
import type { ParseResult } from '../types'
import type { FileMeta } from '../hooks/useChecker'
import { UploadIcon } from './Icons'

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

interface Props {
  parse: ParseResult | null
  fileMeta: FileMeta | null
  error: string | null
  disabled?: boolean
  onFile: (file: File) => void
}

export function DropZone({ parse, fileMeta, error, disabled, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hot, setHot] = useState(false)

  const take = useCallback(
    (file?: File) => {
      if (file) onFile(file)
    },
    [onFile],
  )

  return (
    <div className="card">
      <h2>Key file</h2>
      <div
        className={`dropzone${hot ? ' is-hot' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setHot(true)
        }}
        onDragLeave={() => setHot(false)}
        onDrop={(e) => {
          e.preventDefault()
          setHot(false)
          take(e.dataTransfer.files[0])
        }}
      >
        {parse && fileMeta ? (
          <div className="file-meta">
            <div>
              <span>File</span>
              <b>{fileMeta.name}</b>
            </div>
            <div>
              <span>Size</span>
              <b>{formatBytes(fileMeta.size)}</b>
            </div>
            <div>
              <span>Keys</span>
              <b>{parse.entries.length}</b>
            </div>
            <div>
              <span>Unique</span>
              <b>{parse.uniqueCount}</b>
            </div>
            <div>
              <span>Duplicates</span>
              <b>{parse.duplicateCount}</b>
            </div>
            <div>
              <span>File lines</span>
              <b>{parse.totalLines}</b>
            </div>
          </div>
        ) : (
          <div>
            <UploadIcon />
            <h3>Drop a .txt file here</h3>
            <p>One API key per line. Parsed entirely in this browser — never uploaded to us.</p>
          </div>
        )}
      </div>
      <div className="controls">
        <button type="button" className="btn" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Browse file
        </button>
        <p className="hint">Comments (#, //) and blank lines are skipped. Original line numbers are kept.</p>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept=".txt,text/plain"
        hidden
        onChange={(e) => {
          take(e.target.files?.[0])
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}
