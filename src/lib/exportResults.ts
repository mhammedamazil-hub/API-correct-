import type { KeyRow } from '../types'
import { maskKey, statusLabel } from './maskKey'

function stamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function download(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportCsv(rows: KeyRow[], includeFullKey: boolean): void {
  const header = ['line', 'status', 'api_key', 'http_status', 'detail']
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [
        String(row.line),
        statusLabel(row.status),
        includeFullKey ? row.key : maskKey(row.key),
        row.httpStatus === undefined ? '' : String(row.httpStatus),
        row.detail ?? '',
      ]
        .map(csvEscape)
        .join(','),
    ),
  ]
  download(`api-correct-results-${stamp()}.csv`, lines.join('\n'), 'text/csv;charset=utf-8')
}

export function exportJson(rows: KeyRow[], includeFullKey: boolean): void {
  const payload = rows.map((row) => ({
    line: row.line,
    status: row.status,
    apiKey: includeFullKey ? row.key : maskKey(row.key),
    httpStatus: row.httpStatus ?? null,
    detail: row.detail ?? null,
    duplicateOfLine: row.duplicateOfLine ?? null,
  }))
  download(
    `api-correct-results-${stamp()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8',
  )
}

export function exportValidTxt(rows: KeyRow[]): void {
  const keys = rows.filter((row) => row.status === 'valid').map((row) => row.key)
  download(`api-correct-valid-${stamp()}.txt`, keys.join('\n'), 'text/plain;charset=utf-8')
}
