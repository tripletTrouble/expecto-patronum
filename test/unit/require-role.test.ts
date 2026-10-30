import type { Role, UserStatus } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireRole } from '../../server/utils/require-role'

const { findUnique, getUserSession, clearUserSession } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  getUserSession: vi.fn(),
  clearUserSession: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  default: {
    user: { findUnique },
  },
}))

const event = {} as Parameters<typeof requireRole>[0]

function databaseUser(role: Role, status: UserStatus) {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'user@example.test',
    role,
    status,
    createdAt: new Date('2026-01-01'),
  }
}

describe('requireRole', () => {
  beforeEach(() => {
    findUnique.mockReset()
    getUserSession.mockReset()
    clearUserSession.mockReset()
    vi.stubGlobal('getUserSession', getUserSession)
    vi.stubGlobal('clearUserSession', clearUserSession)
    vi.stubGlobal('createError', (options: { statusCode: number, statusMessage: string, message: string }) =>
      Object.assign(new Error(options.message), options),
    )
  })

  it('returns 401 when there is no session', async () => {
    getUserSession.mockResolvedValue({})

    await expect(requireRole(event, ['TEACHER'])).rejects.toMatchObject({ statusCode: 401 })
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('clears the session and returns 401 when the user was deleted', async () => {
    getUserSession.mockResolvedValue({ user: { id: 'deleted-user' } })
    findUnique.mockResolvedValue(null)

    await expect(requireRole(event, ['TEACHER'])).rejects.toMatchObject({ statusCode: 401 })
    expect(clearUserSession).toHaveBeenCalledWith(event)
  })

  it.each(['PENDING', 'REJECTED'] as const)('returns 403 for a %s teacher', async (status) => {
    getUserSession.mockResolvedValue({ user: { id: 'user-1' } })
    findUnique.mockResolvedValue(databaseUser('TEACHER', status))

    await expect(requireRole(event, ['TEACHER'])).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns 403 when the user has the wrong role', async () => {
    getUserSession.mockResolvedValue({ user: { id: 'user-1' } })
    findUnique.mockResolvedValue(databaseUser('STUDENT', 'APPROVED'))

    await expect(requireRole(event, ['TEACHER'])).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns an approved user for the correct role without a password hash', async () => {
    getUserSession.mockResolvedValue({ user: { id: 'user-1' } })
    findUnique.mockResolvedValue(databaseUser('TEACHER', 'APPROVED'))

    const user = await requireRole(event, ['TEACHER'])

    expect(user).toMatchObject({ id: 'user-1', role: 'TEACHER', status: 'APPROVED' })
    expect(user).not.toHaveProperty('passwordHash')
    const query = findUnique.mock.calls[0][0]
    expect(query.select).not.toHaveProperty('passwordHash')
  })

  it('allows an approved admin when admin access is requested', async () => {
    getUserSession.mockResolvedValue({ user: { id: 'user-1' } })
    findUnique.mockResolvedValue(databaseUser('ADMIN', 'APPROVED'))

    await expect(requireRole(event, ['ADMIN'])).resolves.toMatchObject({ role: 'ADMIN' })
  })
})
