import type { CheckStatus, KeyRow, SortDir, SortKey, StatusFilter } from '../types'

const STATUS_RANK: Record<CheckStatus, number> = {
  valid: 0,
  quota_exceeded: 1,
  rate_limited: 2,
  forbidden: 3,
  invalid: 4,
  cors_blocked: 5,
  network_error: 6,
  unknown_error: 7,
  checking: 8,
  queued: 9,
}

export function filterRows(rows: KeyRow[], query: string, filter: StatusFilter): KeyRow[] {
  const q = query.trim().toLowerCase()
  return rows.filter((row) => {
    if (filter !== 'all' && row.status !== filter) return false
    if (!q) return true
    if (String(row.line).includes(q)) return true
    if (row.key.toLowerCase().includes(q)) return true
    if (row.detail?.toLowerCase().includes(q)) return true
    return false
  })
}

export function sortRows(rows: KeyRow[], sortKey: SortKey, dir: SortDir): KeyRow[] {
  const copy = rows.slice()
  const sign = dir === 'asc' ? 1 : -1
  copy.sort((a, b) => {
    if (sortKey === 'status') {
      const diff = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      if (diff !== 0) return diff * sign
    }
    return (a.line - b.line) * sign
  })
  return copy
}
