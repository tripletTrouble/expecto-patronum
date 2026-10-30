import { getRouterParam } from 'h3'

import {
  changeTeacherStatus,
  TeacherStatusChangeError,
  teacherIdSchema,
} from '../../../../utils/admin-teachers'
import { requireRole } from '../../../../utils/require-role'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const result = teacherIdSchema.safeParse({ id: getRouterParam(event, 'id') })
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'ID guru tidak valid' })
  }

  try {
    return await changeTeacherStatus(result.data.id, 'APPROVED')
  }
  catch (error) {
    if (error instanceof TeacherStatusChangeError) {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: error.message })
    }
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: 'Persetujuan guru gagal' })
  }
})
