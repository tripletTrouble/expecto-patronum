import { readBody } from 'h3'

import { requireRole } from '../../../utils/require-role'
import { categoryBodySchema, createTeacherCategory } from '../../../utils/teacher-categories'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  const result = categoryBodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: result.error.issues[0]?.message ?? 'Data kategori tidak valid' })
  }

  try {
    return await createTeacherCategory(teacher.id, result.data.name)
  }
  catch (error: unknown) {
    if (error instanceof Error && error.name === 'CategoryError' && 'code' in error && error.code === 'DUPLICATE') {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: error.message })
    }
    throw error
  }
})
