import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireRole } = vi.hoisted(() => ({
  requireRole: vi.fn(),
}))

vi.mock('../../server/utils/require-role', () => ({ requireRole }))

describe('current user endpoint', () => {
  beforeEach(() => {
    requireRole.mockReset()
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  })

  it.each(['ADMIN', 'TEACHER', 'STUDENT'] as const)('returns the profile for an approved %s', async (role) => {
    requireRole.mockResolvedValue({
      name: 'Pengguna',
      email: 'user@example.test',
      role,
      status: 'APPROVED',
    })

    const handler = (await import('../../server/api/auth/me.get')).default
    const result = await handler({} as never)

    expect(requireRole).toHaveBeenCalledWith({}, ['ADMIN', 'TEACHER', 'STUDENT'])
    expect(result).toEqual({
      name: 'Pengguna',
      email: 'user@example.test',
      role,
      status: 'APPROVED',
    })
  })
})
