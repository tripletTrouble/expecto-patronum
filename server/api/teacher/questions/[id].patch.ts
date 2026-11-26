import { getRouterParam } from 'h3'
import { ZodError } from 'zod'

import { requireRole } from '../../../utils/require-role'
import { questionIdSchema, TeacherQuestionError, updateTeacherQuestion } from '../../../utils/teacher-questions'
import { QuestionValidationError } from '../../../utils/question-validation'
import { readQuestionBody } from '../../../utils/question-request'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  const idResult = questionIdSchema.safeParse({ id: getRouterParam(event, 'id') })
  if (!idResult.success) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'ID soal tidak valid' })
  try {
    return await updateTeacherQuestion(teacher.id, idResult.data.id, await readQuestionBody(event))
  }
  catch (error: unknown) {
    if (error instanceof QuestionValidationError) throw createError({ statusCode: 404, statusMessage: 'Not Found', message: error.message })
    if (error instanceof TeacherQuestionError) throw createError({ statusCode: 404, statusMessage: 'Not Found', message: error.message })
    if (error instanceof ZodError) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Data soal tidak valid' })
    throw error
  }
})
