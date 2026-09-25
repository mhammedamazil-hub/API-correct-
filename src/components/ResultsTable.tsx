import { maskKey, statusLabel, statusSymbol } from '../lib/maskKey'
import type { KeyRow, SortDir, SortKey } from '../types'

interface Props {
  rows: KeyRow[]
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  onOpen: (row: KeyRow) => void
}

export function ResultsTable({ rows, sortKey, sortDir, onSort, onOpen }: Props) {
  if (rows.length === 0) {
    return <div className="empty">No rows match the current filters.</div>
  }

  const mark = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th onClick={() => onSort('line')}>Line{mark('line')}</th>
            <th onClick={() => onSort('status')}>Status{mark('status')}</th>
            <th>API key</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onOpen(row)}>
              <td>#{row.line}</td>
              <td>
                <span className={`badge ${row.status}`}>
                  {statusSymbol(row.status)} {statusLabel(row.status)}
                </span>
              </td>
              <td className="key">{maskKey(row.key)}</td>
              <td>{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
