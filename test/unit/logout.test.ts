import { beforeEach, describe, expect, it, vi } from 'vitest'

import logout from '../../server/api/auth/logout.post'

const clearUserSession = vi.fn()
const event = {} as Parameters<typeof logout>[0]

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    clearUserSession.mockReset()
    vi.stubGlobal('clearUserSession', clearUserSession)
  })

  it('clears the session', async () => {
    await expect(logout(event)).resolves.toEqual({ success: true })
    expect(clearUserSession).toHaveBeenCalledWith(event)
  })
})
