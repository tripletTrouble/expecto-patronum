import { getRouterParam, readBody } from 'h3'

import { requireRole } from '../../../utils/require-role'
import { categoryBodySchema, categoryIdSchema, renameTeacherCategory } from '../../../utils/teacher-categories'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  const idResult = categoryIdSchema.safeParse({ id: getRouterParam(event, 'id') })
  if (!idResult.success) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'ID kategori tidak valid' })
  const bodyResult = categoryBodySchema.safeParse(await readBody(event))
  if (!bodyResult.success) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: bodyResult.error.issues[0]?.message ?? 'Data kategori tidak valid' })

  try {
    return await renameTeacherCategory(teacher.id, idResult.data.id, bodyResult.data.name)
  }
  catch (error: unknown) {
    if (error instanceof Error && error.name === 'CategoryError' && 'code' in error) {
      if (error.code === 'NOT_FOUND') throw createError({ statusCode: 404, statusMessage: 'Not Found', message: error.message })
      if (error.code === 'DUPLICATE') throw createError({ statusCode: 409, statusMessage: 'Conflict', message: error.message })
    }
    throw error
  }
})
