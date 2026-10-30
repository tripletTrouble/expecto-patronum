import type { Role, UserStatus } from '../../prisma/generated/prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  InvalidCredentialsError,
  loginUser,
} from '../../server/utils/login'

const { findUnique, verifyPassword } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  verifyPassword: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: { user: { findUnique } },
}))

function databaseUser(role: Role, status: UserStatus) {
  return {
    id: `${role.toLowerCase()}-1`,
    role,
    status,
    passwordHash: 'hashed-password',
  }
}

describe('loginUser', () => {
  beforeEach(() => {
    findUnique.mockReset()
    verifyPassword.mockReset()
    vi.stubGlobal('verifyPassword', verifyPassword)
    verifyPassword.mockResolvedValue(true)
  })

  it('rejects an unknown email with the same error as a wrong password', async () => {
    findUnique.mockResolvedValue(null)

    const unknownEmail = loginUser({ email: 'unknown@example.test', password: 'password123' })

    findUnique.mockResolvedValue(databaseUser('STUDENT', 'APPROVED'))
    verifyPassword.mockResolvedValue(false)
    const wrongPassword = loginUser({ email: 'student@example.test', password: 'wrong-password' })

    await expect(unknownEmail).rejects.toBeInstanceOf(InvalidCredentialsError)
    await expect(wrongPassword).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it.each(['PENDING', 'REJECTED'] as const)('rejects a %s teacher after verifying the password', async (status) => {
    findUnique.mockResolvedValue(databaseUser('TEACHER', status))

    await expect(loginUser({ email: 'teacher@example.test', password: 'password123' }))
      .rejects.toMatchObject({ status })
    expect(verifyPassword).toHaveBeenCalledWith('hashed-password', 'password123')
  })

  it.each(['STUDENT', 'TEACHER', 'ADMIN'] as const)('allows an approved %s', async (role) => {
    findUnique.mockResolvedValue(databaseUser(role, 'APPROVED'))

    const user = await loginUser({ email: 'user@example.test', password: 'password123' })

    expect(user).toEqual({ id: `${role.toLowerCase()}-1`, role, status: 'APPROVED' })
    expect(user).not.toHaveProperty('passwordHash')
  })

  it('does not check status before verifying an invalid password', async () => {
    findUnique.mockResolvedValue(databaseUser('TEACHER', 'PENDING'))
    verifyPassword.mockResolvedValue(false)

    await expect(loginUser({ email: 'teacher@example.test', password: 'wrong-password' }))
      .rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('queries only the fields needed for authentication', async () => {
    findUnique.mockResolvedValue(databaseUser('STUDENT', 'APPROVED'))

    await loginUser({ email: 'student@example.test', password: 'password123' })

    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'student@example.test' },
      select: { id: true, role: true, status: true, passwordHash: true },
    })
  })
})
