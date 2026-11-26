import { getQuery } from 'h3'

import { requireRole } from '../../../utils/require-role'
import { listTeacherQuestions, questionQuerySchema } from '../../../utils/teacher-questions'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  const result = questionQuerySchema.safeParse(getQuery(event))
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Parameter soal tidak valid' })
  return listTeacherQuestions(teacher.id, result.data)
})
