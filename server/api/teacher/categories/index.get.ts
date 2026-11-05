import { requireRole } from '../../../utils/require-role'
import { listTeacherCategories } from '../../../utils/teacher-categories'

export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, ['TEACHER'])
  return { data: await listTeacherCategories(teacher.id) }
})
