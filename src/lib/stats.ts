import type { CheckerStats, KeyRow } from '../types'

const FINISHED = new Set([
  'valid',
  'invalid',
  'rate_limited',
  'quota_exceeded',
  'forbidden',
  'network_error',
  'cors_blocked',
  'unknown_error',
])

export function computeStats(rows: KeyRow[]): CheckerStats {
  const stats: CheckerStats = {
    total: rows.length,
    checked: 0,
    valid: 0,
    invalid: 0,
    rateLimited: 0,
    quotaExceeded: 0,
    forbidden: 0,
    networkError: 0,
    corsBlocked: 0,
    unknownError: 0,
    error: 0,
  }

  for (const row of rows) {
    if (FINISHED.has(row.status)) stats.checked += 1
    switch (row.status) {
      case 'valid':
        stats.valid += 1
        break
      case 'invalid':
        stats.invalid += 1
        break
      case 'rate_limited':
        stats.rateLimited += 1
        break
      case 'quota_exceeded':
        stats.quotaExceeded += 1
        break
      case 'forbidden':
        stats.forbidden += 1
        break
      case 'network_error':
        stats.networkError += 1
        break
      case 'cors_blocked':
        stats.corsBlocked += 1
        break
      case 'unknown_error':
        stats.unknownError += 1
        break
      default:
        break
    }
  }

  stats.error = stats.networkError + stats.unknownError
  return stats
}
