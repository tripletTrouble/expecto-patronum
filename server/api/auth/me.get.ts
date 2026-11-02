import { requireRole } from '../../utils/require-role'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  return {
    name: user.name,
    email: user.email,
    role: user.role,
  }
})
