import type { ParseResult, ParsedKey } from '../types'

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, '')
}

function unwrapQuotes(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim()
    }
  }
  return trimmed
}

function isComment(line: string): boolean {
  return line.startsWith('#') || line.startsWith('//') || line.startsWith(';')
}

export function parseKeyFile(text: string): ParseResult {
  const lines = stripBom(text).split(/\r\n|\n|\r/)
  const seen = new Map<string, number>()
  const entries: ParsedKey[] = []
  let skippedEmpty = 0
  let skippedComments = 0

  for (let i = 0; i < lines.length; i += 1) {
    const line = i + 1
    const raw = lines[i] ?? ''
    const key = unwrapQuotes(raw)
    if (!key) {
      skippedEmpty += 1
      continue
    }
    if (isComment(key)) {
      skippedComments += 1
      continue
    }

    const firstLine = seen.get(key)
    if (firstLine !== undefined) {
      entries.push({ line, key, duplicateOfLine: firstLine })
    } else {
      seen.set(key, line)
      entries.push({ line, key })
    }
  }

  return {
    entries,
    uniqueCount: seen.size,
    duplicateCount: entries.length - seen.size,
    skippedEmpty,
    skippedComments,
    totalLines: lines.length,
  }
}

export function uniqueWorkItems(entries: ParsedKey[]): ParsedKey[] {
  return entries.filter((entry) => entry.duplicateOfLine === undefined)
}
