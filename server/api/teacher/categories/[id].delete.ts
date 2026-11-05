import { getRouterParam } from 'h3'

import { requireRole } from '../../../utils/require-role'
import { categoryIdSchema, CategoryError, deleteTeacherCategory } from '../../../utils/teacher-categories'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  const result = categoryIdSchema.safeParse({ id: getRouterParam(event, 'id') })
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'ID kategori tidak valid' })

  try {
    await deleteTeacherCategory(teacher.id, result.data.id)
    return { success: true }
  }
  catch (error: unknown) {
    if (error instanceof CategoryError) {
      if (error.code === 'NOT_FOUND') throw createError({ statusCode: 404, statusMessage: 'Not Found', message: error.message })
      if (error.code === 'HAS_QUESTIONS') throw createError({ statusCode: 409, statusMessage: 'Conflict', message: error.message })
    }
    throw error
  }
})
