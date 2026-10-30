import type { UserStatus } from '../../prisma/generated/prisma/client'
import { z } from 'zod'

import { prisma } from './prisma'

export const teacherPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict()

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
}

export async function listPendingTeachers(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize
  const [teachers, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: { role: 'TEACHER', status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize,
      select: pendingTeacherSelect,
    }),
    prisma.user.count({ where: { role: 'TEACHER', status: 'PENDING' } }),
  ])

  return {
    data: teachers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
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
