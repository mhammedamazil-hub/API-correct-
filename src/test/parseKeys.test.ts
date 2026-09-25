import { describe, expect, it } from 'vitest'
import { parseKeyFile, uniqueWorkItems } from '../lib/parseKeys'

describe('parseKeyFile', () => {
  it('tracks original line numbers across blanks and comments', () => {
    const text = `# header\n\nsk-one\n\n// ignore\nsk-two\n`
    const parsed = parseKeyFile(text)
    expect(parsed.totalLines).toBe(7)
    expect(parsed.entries.map((e) => e.line)).toEqual([3, 6])
    expect(parsed.entries.map((e) => e.key)).toEqual(['sk-one', 'sk-two'])
    expect(parsed.skippedComments).toBe(2)
    expect(parsed.skippedEmpty).toBe(3)
  })

  it('preserves first line of duplicates', () => {
    const text = 'alpha\nbeta\nalpha\n'
    const parsed = parseKeyFile(text)
    expect(parsed.uniqueCount).toBe(2)
    expect(parsed.duplicateCount).toBe(1)
    expect(parsed.entries[2]).toMatchObject({ line: 3, key: 'alpha', duplicateOfLine: 1 })
    expect(uniqueWorkItems(parsed.entries).map((e) => e.line)).toEqual([1, 2])
  })

  it('handles BOM, CRLF, and quoted keys', () => {
    const text = '\uFEFF"sk-quoted"\r\nsk-crlf\r\n'
    const parsed = parseKeyFile(text)
    expect(parsed.entries[0]).toMatchObject({ line: 1, key: 'sk-quoted' })
    expect(parsed.entries[1]).toMatchObject({ line: 2, key: 'sk-crlf' })
  })

  it('does not treat a later unique key as a duplicate', () => {
    const parsed = parseKeyFile('a\nb\nc\n')
    expect(parsed.entries.every((e) => e.duplicateOfLine === undefined)).toBe(true)
  })
})
