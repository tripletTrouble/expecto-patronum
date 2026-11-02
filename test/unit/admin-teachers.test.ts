import type { Role, UserStatus } from '../../prisma/generated/prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  changeTeacherStatus,
  listPendingTeachers,
  teacherQuerySchema,
  TeacherStatusChangeError,
} from '../../server/utils/admin-teachers'

const { count, findMany, findUnique, findUniqueOrThrow, transaction, updateMany } = vi.hoisted(() => ({
  count: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  transaction: vi.fn(),
  updateMany: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    $transaction: transaction,
    user: { count, findMany, findUnique, findUniqueOrThrow, updateMany },
  },
}))

const teacher = {
  id: 'ckz5h0p8x0000s0m4b3q7r2k1',
  name: 'Guru',
  email: 'teacher@example.test',
  createdAt: new Date('2026-01-01'),
}

describe('admin teacher moderation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists teachers with filters, pagination, summary and public fields', async () => {
    findMany.mockResolvedValue([teacher])
    count.mockResolvedValueOnce(21).mockResolvedValueOnce(7).mockResolvedValueOnce(10).mockResolvedValueOnce(4)
    transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries))

    await expect(listPendingTeachers({ page: 2, pageSize: 10, search: 'guru', status: 'PENDING' })).resolves.toEqual({
      data: [teacher],
      pagination: { page: 2, pageSize: 10, total: 21, totalPages: 3 },
      summary: { totalRegistration: 21, totalPending: 7, totalApproved: 10, totalRejected: 4 },
    })
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        role: 'TEACHER',
        status: 'PENDING',
        OR: [
          { name: { contains: 'guru', mode: 'insensitive' } },
          { email: { contains: 'guru', mode: 'insensitive' } },
        ],
      },
      skip: 10,
      take: 10,
      select: { id: true, name: true, email: true, createdAt: true, status: true },
    }))
    expect(findMany.mock.calls[0][0].select).not.toHaveProperty('passwordHash')
  })

  it('rejects impossible dates and reversed date ranges', () => {
    expect(teacherQuerySchema.safeParse({ registeredFrom: '2026-02-30' }).success).toBe(false)
    expect(teacherQuerySchema.safeParse({ registeredFrom: '2026-03-10', registeredTo: '2026-03-01' }).success).toBe(false)
  })

  it('defaults to pending teachers when no status is supplied', () => {
    expect(teacherQuerySchema.parse({}).status).toBe('PENDING')
  })

  it('does not change a rejected teacher', async () => {
    updateMany.mockResolvedValue({ count: 0 })
    findUnique.mockResolvedValue({ ...teacher, role: 'TEACHER' as Role, status: 'REJECTED' as UserStatus })

    await expect(changeTeacherStatus(teacher.id, 'APPROVED')).rejects.toBeInstanceOf(TeacherStatusChangeError)
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: teacher.id, role: 'TEACHER', status: 'PENDING' },
      data: { status: 'APPROVED' },
    })
  })

  it('makes a pending teacher approved', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    findUniqueOrThrow.mockResolvedValue({ ...teacher, role: 'TEACHER', status: 'APPROVED' })

    await expect(changeTeacherStatus(teacher.id, 'APPROVED')).resolves.toMatchObject({ status: 'APPROVED' })
  })

  it('makes a pending teacher rejected', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    findUniqueOrThrow.mockResolvedValue({ ...teacher, role: 'TEACHER', status: 'REJECTED' })

    await expect(changeTeacherStatus(teacher.id, 'REJECTED')).resolves.toMatchObject({ status: 'REJECTED' })
  })

  it('makes repeated approval idempotent', async () => {
    updateMany.mockResolvedValue({ count: 0 })
    findUnique.mockResolvedValue({ ...teacher, role: 'TEACHER', status: 'APPROVED' })

    await expect(changeTeacherStatus(teacher.id, 'APPROVED')).resolves.toMatchObject({ status: 'APPROVED' })
  })
})
