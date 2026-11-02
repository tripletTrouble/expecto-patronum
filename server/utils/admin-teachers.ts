import type { UserStatus } from '../../prisma/generated/prisma/client'
import { z } from 'zod'

import { prisma } from './prisma'

export const teacherPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  registeredFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid').optional(),
  registeredTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid').optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).default('PENDING'),
}).strict()

function isValidDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`)
  const [year, month, day] = value.split('-').map(Number)

  return date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day
}

export const teacherQuerySchema = teacherPaginationSchema.superRefine((query, context) => {
  for (const field of ['registeredFrom', 'registeredTo'] as const) {
    const value = query[field]
    if (value && !isValidDateOnly(value)) {
      context.addIssue({ code: 'custom', path: [field], message: 'Tanggal tidak valid' })
    }
  }

  if (query.registeredFrom && query.registeredTo && query.registeredFrom > query.registeredTo) {
    context.addIssue({ code: 'custom', path: ['registeredTo'], message: 'Rentang tanggal tidak valid' })
  }
})

export const teacherIdSchema = z.object({
  id: z.string().cuid(),
}).strict()

const pendingTeacherSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} as const

export type PendingTeacher = {
  id: string
  name: string
  email: string
  createdAt: Date
  status: UserStatus
}

type TeacherListQuery = z.infer<typeof teacherQuerySchema>

export async function listPendingTeachers(query: TeacherListQuery) {
  const { page, pageSize, search, registeredFrom, registeredTo, status } = query
  const skip = (page - 1) * pageSize
  const createdAt = registeredFrom || registeredTo
    ? {
        ...(registeredFrom ? { gte: new Date(`${registeredFrom}T00:00:00.000Z`) } : {}),
        ...(registeredTo ? { lt: new Date(new Date(`${registeredTo}T00:00:00.000Z`).getTime() + 86_400_000) } : {}),
      }
    : undefined
  const where = {
    role: 'TEACHER' as const,
    ...(status !== 'ALL' ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(createdAt ? { createdAt } : {}),
  }

  const [teachers, total, pending, approved, rejected] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize,
      select: { ...pendingTeacherSelect, status: true },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: 'TEACHER', status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'TEACHER', status: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'TEACHER', status: 'REJECTED' } }),
  ])

  return {
    data: teachers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    summary: {
      totalRegistration: pending + approved + rejected,
      totalPending: pending,
      totalApproved: approved,
      totalRejected: rejected,
    },
  }
}

export class TeacherStatusChangeError extends Error {
  constructor(public readonly status: UserStatus | 'NOT_FOUND') {
    super('Guru tidak ditemukan atau statusnya sudah berubah')
    this.name = 'TeacherStatusChangeError'
  }
}

export async function changeTeacherStatus(id: string, status: Extract<UserStatus, 'APPROVED' | 'REJECTED'>) {
  const result = await prisma.user.updateMany({
    where: { id, role: 'TEACHER', status: 'PENDING' },
    data: { status },
  })

  if (result.count === 0) {
    const teacher = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    })

    if (teacher?.role === 'TEACHER' && teacher.status === status) {
      return teacher
    }

    throw new TeacherStatusChangeError(
      teacher?.role === 'TEACHER' ? teacher.status : 'NOT_FOUND',
    )
  }

  return prisma.user.findUniqueOrThrow({
    where: { id },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  })
}
