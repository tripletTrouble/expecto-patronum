import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DuplicateRegistrationEmailError } from '../../server/utils/register'

const { readBody, registerTeacher, setUserSession } = vi.hoisted(() => ({
  readBody: vi.fn(),
  registerTeacher: vi.fn(),
  setUserSession: vi.fn(),
}))

vi.mock('h3', () => ({ readBody }))
vi.mock('../../server/utils/register-teacher', () => ({ registerTeacher }))

describe('teacher registration endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (error: unknown) => error)
    vi.stubGlobal('setUserSession', setUserSession)
    readBody.mockResolvedValue({
      name: 'Guru',
      email: 'teacher@example.test',
      password: 'password123',
    })
    registerTeacher.mockResolvedValue({
      id: 'teacher-1',
      name: 'Guru',
      email: 'teacher@example.test',
      role: 'TEACHER',
      status: 'PENDING',
    })
  })

  it('registers a teacher without creating a session or exposing credentials', async () => {
    const handler = (await import('../../server/api/auth/register-teacher.post')).default

    await expect(handler({} as never)).resolves.toEqual({
      id: 'teacher-1',
      name: 'Guru',
      email: 'teacher@example.test',
      role: 'TEACHER',
      status: 'PENDING',
    })
    expect(setUserSession).not.toHaveBeenCalled()
    expect(registerTeacher).toHaveBeenCalledWith({
      name: 'Guru',
      email: 'teacher@example.test',
      password: 'password123',
    })
  })

  it('rejects invalid input, including role and status injection', async () => {
    readBody.mockResolvedValue({
      name: 'Guru',
      email: 'teacher@example.test',
      password: 'password123',
      role: 'ADMIN',
      status: 'APPROVED',
    })
    const handler = (await import('../../server/api/auth/register-teacher.post')).default

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
    expect(registerTeacher).not.toHaveBeenCalled()
  })

  it('maps duplicate email errors to a conflict response', async () => {
    registerTeacher.mockRejectedValue(new DuplicateRegistrationEmailError())
    const handler = (await import('../../server/api/auth/register-teacher.post')).default

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Email sudah terdaftar',
    })
  })
})
