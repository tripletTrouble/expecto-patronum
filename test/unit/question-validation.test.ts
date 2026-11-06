import { describe, expect, it } from 'vitest'

import {
  QUESTION_BODY_MAX_LENGTH,
  QUESTION_OPTION_MAX_LENGTH,
  createSanitizer,
  questionSchema,
  sanitizeQuestion,
  sanitizer,
  toPlainText,
} from '../../shared/question-validation'

const categoryId = 'clxxxxxxxxxxxxxxxxxxxxxxxx'

function single(overrides: Record<string, unknown> = {}) {
  return {
    categoryId,
    type: 'SINGLE',
    body: '<p>Pilih jawaban yang benar</p>',
    options: [
      { text: '<strong>A</strong>', isCorrect: true },
      { text: 'B', isCorrect: false },
    ],
    ...overrides,
  }
}

function matching(overrides: Record<string, unknown> = {}) {
  return {
    categoryId,
    type: 'MATCHING',
    body: '<p>Pasangkan</p>',
    options: [
      { text: 'Satu', side: 'LEFT', matchKey: '1' },
      { text: 'Dua', side: 'LEFT', matchKey: '2' },
      { text: 'One', side: 'RIGHT', matchKey: '1' },
      { text: 'Two', side: 'RIGHT', matchKey: '2' },
    ],
    ...overrides,
  }
}

describe('question schema', () => {
  it.each([
    ['SINGLE', single()],
    ['MULTIPLE', { ...single(), type: 'MULTIPLE', options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: true }] }],
    ['TRUE_FALSE', { ...single(), type: 'TRUE_FALSE', options: [{ text: 'Pernyataan 1', isCorrect: true }] }],
    ['MATCHING', matching()],
  ])('accepts a valid %s question', (_, input) => {
    expect(questionSchema.safeParse(input).success).toBe(true)
  })

  it('rejects empty body content including empty HTML and stripped containers', () => {
    for (const body of ['', '<p></p>', '<p>&nbsp;</p>', ' \n\t ', '<script>alert(1)</script>', '<noscript>alert(1)</noscript>', '<template>alert(1)</template>', '<plaintext>alert(1)']) {
      expect(questionSchema.safeParse(single({ body })).success).toBe(false)
    }
  })

  it('rejects options whose content is removed by sanitization', () => {
    expect(questionSchema.safeParse(single({ options: [
      { text: '<noscript>A</noscript>', isCorrect: true },
      { text: 'B', isCorrect: false },
    ] })).success).toBe(false)
  })

  it('rejects invalid category identifiers and client-supplied points', () => {
    expect(questionSchema.safeParse(single({ categoryId: 'not-a-cuid' })).success).toBe(false)
    expect(questionSchema.safeParse(single({ points: 10 })).success).toBe(false)
  })

  it('enforces SINGLE option count, non-empty options, and exactly one correct answer', () => {
    expect(questionSchema.safeParse(single({ options: [{ text: 'A', isCorrect: true }] })).success).toBe(false)
    expect(questionSchema.safeParse(single({ options: [{ text: 'A', isCorrect: false }, { text: 'B', isCorrect: false }] })).success).toBe(false)
    expect(questionSchema.safeParse(single({ options: [{ text: '', isCorrect: true }, { text: 'B', isCorrect: false }] })).success).toBe(false)
    expect(questionSchema.safeParse(single({ options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: true }] })).success).toBe(false)
  })

  it('enforces MULTIPLE option count, non-empty options, and at least one correct answer', () => {
    const base = { ...single(), type: 'MULTIPLE', options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] }
    expect(questionSchema.safeParse({ ...base, options: [{ text: 'A', isCorrect: true }] }).success).toBe(false)
    expect(questionSchema.safeParse({ ...base, options: [{ text: '', isCorrect: true }, { text: 'B', isCorrect: false }] }).success).toBe(false)
    expect(questionSchema.safeParse({ ...base, options: [{ text: 'A', isCorrect: false }, { text: 'B', isCorrect: false }] }).success).toBe(false)
  })

  it('allows any number of true/false statements but rejects empty and duplicate text', () => {
    const base = { ...single(), type: 'TRUE_FALSE' }
    expect(questionSchema.safeParse({ ...base, options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: true }] }).success).toBe(true)
    expect(questionSchema.safeParse({ ...base, options: [{ text: 'A', isCorrect: true }, { text: ' a ', isCorrect: false }] }).success).toBe(false)
    expect(questionSchema.safeParse({ ...base, options: [{ text: '', isCorrect: true }] }).success).toBe(false)
    expect(questionSchema.safeParse({ ...base, options: [] }).success).toBe(false)
  })

  it('enforces at least two matching pairs and one partner per left item', () => {
    expect(questionSchema.safeParse(matching({ options: matching().options.slice(0, 3) })).success).toBe(false)
    expect(questionSchema.safeParse(matching({ options: [
      { text: 'Satu', side: 'LEFT', matchKey: '1' },
      { text: 'Dua', side: 'LEFT', matchKey: '2' },
      { text: 'One', side: 'RIGHT', matchKey: '1' },
      { text: 'Two', side: 'RIGHT', matchKey: '3' },
    ] })).success).toBe(false)
    expect(questionSchema.safeParse(matching({ options: [
      { text: 'Satu', side: 'LEFT', matchKey: '1' },
      { text: 'Dua', side: 'LEFT', matchKey: '2' },
      { text: 'One', side: 'RIGHT', matchKey: '1' },
      { text: 'Also one', side: 'RIGHT', matchKey: '1' },
    ] })).success).toBe(false)
    expect(questionSchema.safeParse(matching({ options: [
      { text: '', side: 'LEFT', matchKey: '1' },
      { text: 'Dua', side: 'LEFT', matchKey: '2' },
      { text: 'One', side: 'RIGHT', matchKey: '1' },
      { text: 'Two', side: 'RIGHT', matchKey: '2' },
    ] })).success).toBe(false)
  })

  it('requires explanations to be plain text', () => {
    expect(questionSchema.safeParse(single({ explanation: '<strong>Geen</strong>' })).success).toBe(false)
    expect(questionSchema.safeParse(single({ explanation: 'Penjelasan biasa' })).success).toBe(true)
  })

  it('enforces body and option size limits', () => {
    expect(questionSchema.safeParse(single({ body: 'x'.repeat(QUESTION_BODY_MAX_LENGTH + 1) })).success).toBe(false)
    expect(questionSchema.safeParse(single({ options: [{ text: 'x'.repeat(QUESTION_OPTION_MAX_LENGTH + 1), isCorrect: true }, { text: 'B', isCorrect: false }] })).success).toBe(false)
  })

  it('uses Indonesian validation messages', () => {
    const result = questionSchema.safeParse(single({ body: '' }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues.map(issue => issue.message).join(' ')).toContain('wajib diisi')
  })
})

describe('question sanitizer', () => {
  it('keeps the body formatting allowlist and removes unsafe markup', () => {
    const clean = sanitizer.body('<p><strong>A</strong> <em>B</em> <u>C</u><br><ul><li>D</li></ul></p><script>alert(1)</script><img src="x"><a href="javascript:alert(1)">link</a><table><tr><td>bad</td></tr></table>')
    expect(clean).toContain('<strong>A</strong>')
    expect(clean).toContain('<em>B</em>')
    expect(clean).toContain('<u>C</u>')
    expect(clean).toContain('<br />')
    expect(clean).not.toMatch(/script|img|href|table|td|alert/i)
  })

  it('keeps only inline formatting for options', () => {
    const clean = sanitizer.option('<strong>A</strong><p>B</p><ul><li>C</li></ul><iframe src="x"></iframe><span style="color:red">D</span>')
    expect(clean).toContain('<strong>A</strong>')
    expect(clean).not.toMatch(/<p|<ul|<li|iframe|style|span/i)
  })

  it('supports adding allowlisted elements through configuration', () => {
    const configured = createSanitizer({ bodyAllowedTags: ['p', 'mark'] })
    expect(configured.body('<mark>ditandai</mark><strong>dihapus</strong>')).toBe('<mark>ditandai</mark>')
  })

  it('normalizes plain text for emptiness and duplicate checks', () => {
    expect(toPlainText('<p>  A&nbsp; B </p><br> C')).toBe('A B C')
    expect(toPlainText('<p>&nbsp;</p>')).toBe('')
  })

  it('returns sanitized body and bodyText, while ignoring no client points', () => {
    const result = sanitizeQuestion(single())
    expect(result.body).toBe('<p>Pilih jawaban yang benar</p>')
    expect(result.bodyText).toBe('Pilih jawaban yang benar')
    expect(result).not.toHaveProperty('points')
  })
})
