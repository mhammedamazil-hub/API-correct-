const KEY_IN_QUERY = /([?&](?:key|api_key|apikey|token)=)[^&\s]+/gi
const BEARER = /Bearer\s+\S+/gi
const HEADER_KEYS = /((?:x-api-key|x-goog-api-key|authorization)\s*[:=]\s*)\S+/gi

export function scrubText(text: string, key?: string): string {
  let out = text
  if (key && key.length >= 6) {
    out = out.split(key).join('[redacted]')
  }
  out = out.replace(KEY_IN_QUERY, '$1[redacted]')
  out = out.replace(BEARER, 'Bearer [redacted]')
  out = out.replace(HEADER_KEYS, '$1[redacted]')
  return out
}

export function safeErrorName(err: unknown): string {
  if (err instanceof DOMException) return err.name
  if (err instanceof Error) return err.name || 'Error'
  return 'Error'
}

export function clipBody(text: string, max = 4000): string {
  if (text.length <= max) return text
  return text.slice(0, max)
}
