import type { CheckStatus, RawCheck } from '../types'

function lower(text: string | undefined): string {
  return (text ?? '').toLowerCase()
}

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

const INVALID_HINTS = [
  'invalid api key',
  'incorrect api key',
  'invalid_api_key',
  'api key not valid',
  'api_key_invalid',
  'unauthorized',
  'authentication',
  'not a valid api key',
  'unknown api key',
  'no api key found',
  'missing api key',
  'invalid token',
  'invalid x-api-key',
  'incorrect_api_key',
  'api key expired',
  'revoked',
]

const QUOTA_HINTS = [
  'insufficient_quota',
  'quota',
  'billing',
  'credit',
  'payment required',
  'exceeded your current quota',
  'resource_exhausted',
  'spend limit',
  'out of credits',
]

const RATE_HINTS = ['rate limit', 'too many requests', 'rate_limit']

export function classifyRaw(raw: RawCheck): CheckStatus {
  if (raw.aborted) return 'unknown_error'
  if (raw.corsBlocked) return 'cors_blocked'
  if (raw.networkError || raw.timedOut) return 'network_error'

  const status = raw.httpStatus
  const body = lower(raw.bodyText)

  if (status === undefined) return 'unknown_error'

  if (status >= 200 && status < 300) {
    if (hasAny(body, ['"valid": false', '"valid":false'])) return 'invalid'
    return 'valid'
  }

  if (status === 401) return 'invalid'

  if (status === 402) return 'quota_exceeded'

  if (status === 429) {
    if (hasAny(body, QUOTA_HINTS) && !hasAny(body, RATE_HINTS)) return 'quota_exceeded'
    if (hasAny(body, QUOTA_HINTS) && hasAny(body, ['insufficient_quota', 'credit', 'billing'])) {
      return 'quota_exceeded'
    }
    if (hasAny(body, ['insufficient_quota', 'resource_exhausted', 'out of credits'])) {
      return 'quota_exceeded'
    }
    return 'rate_limited'
  }

  if (status === 403) {
    if (hasAny(body, INVALID_HINTS)) return 'invalid'
    if (hasAny(body, QUOTA_HINTS)) return 'quota_exceeded'
    return 'forbidden'
  }

  if (status === 400 || status === 404) {
    if (hasAny(body, INVALID_HINTS)) return 'invalid'
    if (hasAny(body, QUOTA_HINTS)) return 'quota_exceeded'
    return 'unknown_error'
  }

  if (status >= 500) return 'unknown_error'

  if (hasAny(body, INVALID_HINTS)) return 'invalid'
  if (hasAny(body, QUOTA_HINTS)) return 'quota_exceeded'
  if (hasAny(body, RATE_HINTS)) return 'rate_limited'

  return 'unknown_error'
}

export function statusDetail(status: CheckStatus, httpStatus?: number): string {
  switch (status) {
    case 'valid':
      return 'Authorized request succeeded.'
    case 'invalid':
      return httpStatus
        ? `Provider rejected the credential (HTTP ${httpStatus}).`
        : 'Provider rejected the credential.'
    case 'rate_limited':
      return 'Provider rate-limited the request. Temporary — not treated as invalid.'
    case 'quota_exceeded':
      return 'Credential authenticated but quota or billing is exhausted.'
    case 'forbidden':
      return httpStatus
        ? `Provider forbade this request (HTTP ${httpStatus}). Key may be valid without this permission.`
        : 'Provider forbade this request.'
    case 'network_error':
      return 'Network failure before a provider verdict. Not treated as invalid.'
    case 'cors_blocked':
      return 'BROWSER BLOCKED — This provider cannot be verified directly from a static frontend.'
    case 'unknown_error':
      return httpStatus
        ? `Unexpected provider response (HTTP ${httpStatus}). Not treated as invalid.`
        : 'Unexpected error. Not treated as invalid.'
    case 'checking':
      return 'Request in flight.'
    default:
      return 'Waiting to be checked.'
  }
}

export function isRetryable(status: CheckStatus): boolean {
  return status === 'rate_limited' || status === 'network_error'
}
