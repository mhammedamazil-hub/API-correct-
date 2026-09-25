export type ProviderId =
  | 'openai'
  | 'gemini'
  | 'anthropic'
  | 'groq'
  | 'openrouter'
  | 'mistral'
  | 'cohere'
  | 'together'

export type CheckStatus =
  | 'queued'
  | 'checking'
  | 'valid'
  | 'invalid'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'forbidden'
  | 'network_error'
  | 'cors_blocked'
  | 'unknown_error'

export type RunState = 'idle' | 'running' | 'paused' | 'stopped' | 'done'

export interface ParsedKey {
  line: number
  key: string
  duplicateOfLine?: number
}

export interface ParseResult {
  entries: ParsedKey[]
  uniqueCount: number
  duplicateCount: number
  skippedEmpty: number
  skippedComments: number
  totalLines: number
}

export interface KeyRow {
  id: string
  line: number
  key: string
  duplicateOfLine?: number
  status: CheckStatus
  detail?: string
  httpStatus?: number
  checkedAt?: number
}

export interface RawCheck {
  httpStatus?: number
  bodyText?: string
  retryAfterMs?: number
  networkError?: boolean
  corsBlocked?: boolean
  aborted?: boolean
  timedOut?: boolean
}

export interface CheckerStats {
  total: number
  checked: number
  valid: number
  invalid: number
  rateLimited: number
  quotaExceeded: number
  forbidden: number
  networkError: number
  corsBlocked: number
  unknownError: number
  error: number
}

export type StatusFilter = 'all' | CheckStatus

export type SortKey = 'line' | 'status'
export type SortDir = 'asc' | 'desc'
