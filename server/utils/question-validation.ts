import { questionSchema, sanitizeQuestion } from '../../shared/question-validation'

import { prisma } from './prisma'

export class QuestionValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuestionValidationError'
  }
}

export async function validateTeacherQuestion(teacherId: string, input: unknown) {
  const parsed = questionSchema.safeParse(input)
  if (!parsed.success) throw parsed.error

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, teacherId },
    select: { id: true },
  })
  if (!category) throw new QuestionValidationError('Kategori tidak ditemukan')

  return sanitizeQuestion(parsed.data)
}
