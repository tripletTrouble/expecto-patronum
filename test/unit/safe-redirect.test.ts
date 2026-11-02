import { describe, expect, it } from 'vitest'

import { safeRedirect } from '../../app/utils/safe-redirect'

describe('safeRedirect', () => {
  it.each(['/admin/teachers', '/admin/teachers?page=2'])('allows internal path %s', (path) => {
    expect(safeRedirect(path)).toBe(path)
  })

  it.each([undefined, null, '', 'https://example.com', '//example.com', '/\\\\evil.com', '/admin/\u0000teachers', 'admin/teachers'])('rejects unsafe redirect %s', (value) => {
    expect(safeRedirect(value)).toBe('/')
  })
})
