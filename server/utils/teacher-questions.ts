import type { Prisma } from '../../prisma/generated/prisma/client'
import { z } from 'zod'

import { questionSchema } from '../../shared/question-validation'
import type { sanitizeQuestion } from '../../shared/question-validation'
import { prisma } from './prisma'
import { validateTeacherQuestion } from './question-validation'

export const questionIdSchema = z.object({ id: z.string().cuid() }).strict()

export const questionQuerySchema = z.object({
  categoryId: z.string().cuid('Kategori tidak valid').optional(),
  type: z.enum(['SINGLE', 'MULTIPLE', 'MATCHING', 'TRUE_FALSE']).optional(),
  search: z.string().trim().max(200, 'Pencarian terlalu panjang').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict()

export const questionBodySchema = questionSchema

type SanitizedQuestion = ReturnType<typeof sanitizeQuestion>
type QuestionQuery = z.infer<typeof questionQuerySchema>

const questionSelect = {
  id: true,
  categoryId: true,
  type: true,
  body: true,
  bodyText: true,
  explanation: true,
  points: true,
  createdAt: true,
  updatedAt: true,
  options: {
    orderBy: { sortOrder: 'asc' as const },
    select: { id: true, text: true, isCorrect: true, side: true, matchKey: true, sortOrder: true },
  },
} as const

export class TeacherQuestionError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'CATEGORY_NOT_FOUND', message: string) {
    super(message)
    this.name = 'TeacherQuestionError'
  }
}

function getPoints(input: SanitizedQuestion) {
  if (input.type === 'SINGLE') return 1
  if (input.type === 'MULTIPLE') return input.options.filter(option => option.isCorrect).length
  if (input.type === 'TRUE_FALSE') return input.options.length
  return input.options.filter(option => 'side' in option && option.side === 'LEFT').length
}

function optionData(input: SanitizedQuestion) {
  return input.options.map((option, sortOrder) => ({
    text: option.text,
    isCorrect: option.isCorrect ?? false,
    side: 'side' in option ? option.side : null,
    matchKey: 'matchKey' in option ? option.matchKey : null,
    sortOrder,
  }))
}

function questionData(input: SanitizedQuestion, teacherId: string) {
  return {
    teacherId,
    categoryId: input.categoryId,
    type: input.type,
    body: input.body,
    bodyText: input.bodyText,
    explanation: input.explanation ?? null,
    points: getPoints(input),
  }
}

function serializeQuestion(question: {
  id: string
  categoryId: string | null
  type: string
  body: string
  bodyText: string
  explanation: string | null
  points: Prisma.Decimal
  createdAt: Date
  updatedAt: Date
  options: Array<{ id: string, text: string, isCorrect: boolean, side: string | null, matchKey: string | null, sortOrder: number }>
}) {
  return { ...question, points: Number(question.points), options: question.options }
}

export async function createTeacherQuestion(teacherId: string, input: unknown) {
  const validated = await validateTeacherQuestion(teacherId, input)
  const question = await prisma.question.create({
    data: { ...questionData(validated, teacherId), options: { create: optionData(validated) } },
    select: questionSelect,
  })
  return serializeQuestion(question)
}

export async function getTeacherQuestion(teacherId: string, id: string) {
  const question = await prisma.question.findFirst({
    where: { id, teacherId, deletedAt: null },
    select: questionSelect,
  })
  if (!question) throw new TeacherQuestionError('NOT_FOUND', 'Soal tidak ditemukan')
  return serializeQuestion(question)
}

export async function listTeacherQuestions(teacherId: string, query: QuestionQuery) {
  const where = {
    teacherId,
    deletedAt: null,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.search ? { bodyText: { contains: query.search, mode: 'insensitive' as const } } : {}),
  }
  const [questions, total] = await Promise.all([
    prisma.question.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, select: questionSelect }),
    prisma.question.count({ where }),
  ])
  return { data: questions.map(serializeQuestion), pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } }
}

export async function updateTeacherQuestion(teacherId: string, id: string, input: unknown) {
  const validated = await validateTeacherQuestion(teacherId, input)
  const question = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.question.findFirst({ where: { id, teacherId, deletedAt: null }, select: { id: true } })
    if (!existing) throw new TeacherQuestionError('NOT_FOUND', 'Soal tidak ditemukan')
    await transaction.questionOption.deleteMany({ where: { questionId: id } })
    return transaction.question.update({
      where: { id },
      data: { ...questionData(validated, teacherId), options: { create: optionData(validated) } },
      select: questionSelect,
    })
  })
  return serializeQuestion(question)
}

export async function deleteTeacherQuestion(teacherId: string, id: string) {
  const result = await prisma.question.updateMany({ where: { id, teacherId, deletedAt: null }, data: { deletedAt: new Date() } })
  if (result.count === 0) throw new TeacherQuestionError('NOT_FOUND', 'Soal tidak ditemukan')
}
