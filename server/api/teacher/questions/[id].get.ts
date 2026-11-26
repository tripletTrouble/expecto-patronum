import { getRouterParam } from 'h3'

import { requireRole } from '../../../utils/require-role'
import { getTeacherQuestion, questionIdSchema, TeacherQuestionError } from '../../../utils/teacher-questions'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  const result = questionIdSchema.safeParse({ id: getRouterParam(event, 'id') })
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'ID soal tidak valid' })
  try {
    return await getTeacherQuestion(teacher.id, result.data.id)
  }
  catch (error: unknown) {
    if (error instanceof TeacherQuestionError) throw createError({ statusCode: 404, statusMessage: 'Not Found', message: error.message })
    throw error
  }
})
