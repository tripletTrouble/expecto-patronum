import { getQuery } from 'h3'

import { listPendingTeachers, teacherPaginationSchema } from '../../../utils/admin-teachers'
import { requireRole } from '../../../utils/require-role'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const result = teacherPaginationSchema.safeParse(getQuery(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Parameter halaman tidak valid',
    })
  }

  return listPendingTeachers(result.data.page, result.data.pageSize)
})
