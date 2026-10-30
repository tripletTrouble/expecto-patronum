import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../../prisma/generated/prisma/client'

import {
  DuplicateStudentEmailError,
  registerStudent,
  studentRegistrationSchema,
} from '../../server/utils/register-student'

const { create, hashPassword } = vi.hoisted(() => ({
  create: vi.fn(),
  hashPassword: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: { user: { create } },
}))

describe('student registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('hashPassword', hashPassword)
    hashPassword.mockResolvedValue('hashed-password')
    create.mockResolvedValue({
      id: 'student-1',
      name: 'Siswa',
      email: 'student@example.test',
      role: 'STUDENT',
      status: 'APPROVED',
    })
  })

  it('normalizes the email, hashes the password, and sets server-owned fields', async () => {
    const input = studentRegistrationSchema.parse({
      name: ' Siswa ',
      email: ' STUDENT@Example.TEST ',
      password: 'password123',
    })

    await expect(registerStudent(input)).resolves.toEqual({
      id: 'student-1',
      name: 'Siswa',
      email: 'student@example.test',
      role: 'STUDENT',
      status: 'APPROVED',
    })
    expect(hashPassword).toHaveBeenCalledWith('password123')
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'Siswa',
        email: 'student@example.test',
        passwordHash: 'hashed-password',
        role: 'STUDENT',
        status: 'APPROVED',
      }),
    }))
  })

  it('strips no unknown fields and therefore rejects role/status injection', () => {
    const result = studentRegistrationSchema.safeParse({
      name: 'Siswa',
      email: 'student@example.test',
      password: 'password123',
      role: 'ADMIN',
      status: 'APPROVED',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid input', () => {
    expect(studentRegistrationSchema.safeParse({ name: '', email: 'bad', password: 'short' }).success).toBe(false)
    expect(studentRegistrationSchema.safeParse({ name: 'Siswa', email: 'student@example.test', password: 'a'.repeat(129) }).success).toBe(false)
  })

  it('converts duplicate email errors into a safe domain error', async () => {
    create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate email', {
      code: 'P2002',
      clientVersion: '6.0.0',
    }))

    await expect(registerStudent({
      name: 'Siswa',
      email: 'student@example.test',
      password: 'password123',
    })).rejects.toBeInstanceOf(DuplicateStudentEmailError)
  })
})
