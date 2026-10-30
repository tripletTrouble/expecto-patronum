import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../../prisma/generated/prisma/client'

import {
  DuplicateRegistrationEmailError,
  registrationSchema,
} from '../../server/utils/register'
import { registerTeacher } from '../../server/utils/register-teacher'

const { create, hashPassword } = vi.hoisted(() => ({
  create: vi.fn(),
  hashPassword: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: { user: { create } },
}))

describe('teacher registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('hashPassword', hashPassword)
    hashPassword.mockResolvedValue('hashed-password')
    create.mockResolvedValue({
      id: 'teacher-1',
      name: 'Guru',
      email: 'teacher@example.test',
      role: 'TEACHER',
      status: 'PENDING',
    })
  })

  it('creates a pending teacher without exposing the password hash', async () => {
    const input = registrationSchema.parse({
      name: ' Guru ',
      email: ' TEACHER@Example.TEST ',
      password: 'password123',
    })

    await expect(registerTeacher(input)).resolves.toEqual({
      id: 'teacher-1',
      name: 'Guru',
      email: 'teacher@example.test',
      role: 'TEACHER',
      status: 'PENDING',
    })
    expect(hashPassword).toHaveBeenCalledWith('password123')
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role: 'TEACHER', status: 'PENDING' }),
    }))
  })

  it('rejects invalid input and role/status injection', () => {
    expect(registrationSchema.safeParse({ name: '', email: 'bad', password: 'short' }).success).toBe(false)
    expect(registrationSchema.safeParse({
      name: 'Guru', email: 'teacher@example.test', password: 'password123', role: 'ADMIN', status: 'APPROVED',
    }).success).toBe(false)
  })

  it('converts duplicate email errors into a safe domain error', async () => {
    create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate email', {
      code: 'P2002',
      clientVersion: '6.0.0',
    }))

    await expect(registerTeacher({
      name: 'Guru', email: 'teacher@example.test', password: 'password123',
    })).rejects.toBeInstanceOf(DuplicateRegistrationEmailError)
  })
})
