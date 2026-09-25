export function maskKey(key: string): string {
  const value = key.trim()
  if (!value) return ''
  if (value.length <= 8) return '•'.repeat(Math.min(value.length, 8))
  if (value.length <= 16) {
    return `${value.slice(0, 4)}…${value.slice(-3)}`
  }
  const start = value.slice(0, 8)
  const end = value.slice(-4)
  return `${start}${'•'.repeat(8)}${end}`
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'queued':
      return 'QUEUED'
    case 'checking':
      return 'CHECKING'
    case 'valid':
      return 'VALID'
    case 'invalid':
      return 'INVALID'
    case 'rate_limited':
      return 'RATE LIMITED'
    case 'quota_exceeded':
      return 'QUOTA EXCEEDED'
    case 'forbidden':
      return 'FORBIDDEN'
    case 'network_error':
      return 'NETWORK ERROR'
    case 'cors_blocked':
      return 'CORS / BROWSER BLOCKED'
    case 'unknown_error':
      return 'UNKNOWN ERROR'
    default:
      return status.toUpperCase()
  }
}

export function statusSymbol(status: string): string {
  switch (status) {
    case 'valid':
      return '✓'
    case 'invalid':
      return '✗'
    case 'rate_limited':
    case 'quota_exceeded':
      return '⚠'
    case 'forbidden':
      return '⛔'
    case 'cors_blocked':
      return '⊘'
    case 'network_error':
      return '☁'
    case 'checking':
      return '…'
    case 'queued':
      return '○'
    default:
      return '•'
  }
}
