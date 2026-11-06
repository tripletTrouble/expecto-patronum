import { Prisma } from '../../prisma/generated/prisma/client'
import { z } from 'zod'

import { prisma } from './prisma'

export const categoryIdSchema = z.object({ id: z.string().cuid() }).strict()

export const categoryBodySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(100, 'Nama kategori terlalu panjang'),
}).strict()

export const categoryQuerySchema = z.object({
  search: z.string().trim().max(100, 'Pencarian kategori terlalu panjang').optional(),
}).strict()

const categorySelect = {
  id: true,
  name: true,
  createdAt: true,
  _count: {
    select: {
      questions: { where: { deletedAt: null } },
    },
  },
} as const

export class CategoryError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'DUPLICATE' | 'HAS_QUESTIONS',
    message: string,
  ) {
    super(message)
    this.name = 'CategoryError'
  }
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

type CategoryQuery = z.infer<typeof categoryQuerySchema>

export async function listTeacherCategories(teacherId: string, query: CategoryQuery = {}) {
  const categories = await prisma.category.findMany({
    where: {
      teacherId,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    },
    orderBy: { name: 'asc' },
    select: categorySelect,
  })

  return categories.map(category => ({
    id: category.id,
    name: category.name,
    createdAt: category.createdAt,
    questionCount: category._count.questions,
  }))
}

export async function createTeacherCategory(teacherId: string, name: string) {
  try {
    const category = await prisma.category.create({
      data: { teacherId, name },
      select: categorySelect,
    })

    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      questionCount: category._count.questions,
    }
  }
  catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw new CategoryError('DUPLICATE', 'Kategori dengan nama tersebut sudah ada')
    }
    throw error
  }
}

export async function renameTeacherCategory(teacherId: string, id: string, name: string) {
  const existing = await prisma.category.findFirst({ where: { id, teacherId }, select: { id: true } })
  if (!existing) throw new CategoryError('NOT_FOUND', 'Kategori tidak ditemukan')

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name },
      select: categorySelect,
    })

    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      questionCount: category._count.questions,
    }
  }
  catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw new CategoryError('DUPLICATE', 'Kategori dengan nama tersebut sudah ada')
    }
    throw error
  }
}

export async function deleteTeacherCategory(teacherId: string, id: string) {
  return prisma.$transaction(async (transaction) => {
    const category = await transaction.category.findFirst({
      where: { id, teacherId },
      select: { id: true },
    })
    if (!category) throw new CategoryError('NOT_FOUND', 'Kategori tidak ditemukan')

    const activeQuestionCount = await transaction.question.count({
      where: { categoryId: id, deletedAt: null },
    })
    if (activeQuestionCount > 0) {
      throw new CategoryError('HAS_QUESTIONS', 'Kategori tidak dapat dihapus karena masih memiliki soal aktif')
    }

    await transaction.question.updateMany({
      where: { categoryId: id, deletedAt: { not: null } },
      data: { categoryId: null },
    })
    await transaction.category.delete({ where: { id } })
  })
}
