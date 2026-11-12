import { ZodError } from 'zod'
import { requireRole } from '../../../utils/require-role'
import { createTeacherQuestion } from '../../../utils/teacher-questions'
import { QuestionValidationError } from '../../../utils/question-validation'
import { readQuestionBody } from '../../../utils/question-request'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  try {
    return await createTeacherQuestion(teacher.id, await readQuestionBody(event))
  }
  catch (error: unknown) {
    if (error instanceof QuestionValidationError) throw createError({ statusCode: 404, statusMessage: 'Not Found', message: error.message })
    if (error instanceof ZodError) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Data soal tidak valid' })
    throw error
  }
})
