import type { Role, UserStatus } from '../../prisma/generated/prisma/client'
import type { H3Event } from 'h3'

import prisma from './prisma'

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} as const

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
  createdAt: Date
}

const unauthorizedError = () => createError({
  statusCode: 401,
  statusMessage: 'Unauthorized',
  message: 'Unauthorized',
})

const forbiddenError = () => createError({
  statusCode: 403,
  statusMessage: 'Forbidden',
  message: 'Forbidden',
})

export async function requireRole(
  event: H3Event,
  allowedRoles: readonly Role[],
): Promise<AuthenticatedUser> {
  const session = await getUserSession(event)
  const userId = session.user?.id

  if (!userId) {
    throw unauthorizedError()
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  })

  if (!user) {
    await clearUserSession(event)
    throw unauthorizedError()
  }

  if (user.status !== 'APPROVED' || !allowedRoles.includes(user.role)) {
    throw forbiddenError()
  }

  return user
}
