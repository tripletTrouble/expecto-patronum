import { getQuery } from 'h3'

import { requireRole } from '../../../utils/require-role'
import { categoryQuerySchema, listTeacherCategories } from '../../../utils/teacher-categories'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  const result = categoryQuerySchema.safeParse(getQuery(event))
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Parameter pencarian tidak valid' })
  }

  return { data: await listTeacherCategories(teacher.id, result.data) }
})
