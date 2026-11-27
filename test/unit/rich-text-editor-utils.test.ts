import { describe, expect, it } from 'vitest'

import {
  sanitizeEditorContent,
  sanitizePastedContent,
} from '../../app/components/editor/rich-text-editor-utils'

describe('rich text editor sanitization', () => {
  it('keeps the full editor allowlist and removes unsupported markup', () => {
    const result = sanitizeEditorContent(
      '<p><strong>tebal</strong> <em>miring</em> <u>garis</u> <sub>bawah</sub> <sup>atas</sup></p><ul><li>item</li></ul><img src="x"><a href="https://example.com">tautan</a>',
      'body',
    )

    expect(result).toContain('<strong>tebal</strong>')
    expect(result).toContain('<ul><li>item</li></ul>')
    expect(result).not.toMatch(/img|href|tautan/i)
  })

  it('keeps only inline formatting for the compact editor', () => {
    const result = sanitizeEditorContent('<p><strong>A</strong></p><ul><li>B</li></ul><div>C</div>', 'option')

    expect(result).toBe('<strong>A</strong>BC')
    expect(result).not.toMatch(/p|ul|li|div/i)
  })

  it('cleans pasted web and Word markup before inserting it', () => {
    const result = sanitizePastedContent(
      '<p class="MsoNormal"><strong>A</strong><span style="color:red">B</span></p><table><tr><td>C</td></tr></table><script>alert(1)</script>',
      'body',
    )

    expect(result).toContain('<p><strong>A</strong>B</p>')
    expect(result).not.toMatch(/class|style|table|script|alert/i)
  })

  it('canonicalizes paragraph-backed compact documents for model comparisons', () => {
    expect(sanitizeEditorContent('<p><strong>A</strong></p>', 'option')).toBe('<strong>A</strong>')
    expect(sanitizeEditorContent('<strong>A</strong>', 'option')).toBe('<strong>A</strong>')
  })

  it('removes block elements from compact pasted content', () => {
    const result = sanitizePastedContent('<p><strong>A</strong></p><div>B</div><ul><li>C</li></ul>', 'option')

    expect(result).toBe('<strong>A</strong>BC')
  })
})
