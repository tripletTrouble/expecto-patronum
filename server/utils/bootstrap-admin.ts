import { z } from 'zod'

import { prisma } from './prisma'

const adminEnvironmentSchema = z.object({
  ADMIN_EMAIL: z.string({ error: 'ADMIN_EMAIL is required' }).email('ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z.string({ error: 'ADMIN_PASSWORD is required' }).min(12, 'ADMIN_PASSWORD must be at least 12 characters'),
})

export type BootstrapAdminResult = { created: true }
  | { created: false, reason: 'already_exists' }

function readAdminEnvironment() {
  const result = adminEnvironmentSchema.safeParse({
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  })

  if (!result.success) {
    const messages = result.error.issues.map(issue => issue.message).join('; ')
    throw new Error(`Cannot bootstrap admin: ${messages}`)
  }

  return result.data
}

export async function bootstrapAdmin(): Promise<BootstrapAdminResult> {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = readAdminEnvironment()

  return prisma.$transaction(async (transaction) => {
    const existingAdmin = await transaction.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    if (existingAdmin) {
      return { created: false, reason: 'already_exists' }
    }

    const passwordHash = await hashPassword(ADMIN_PASSWORD)

    await transaction.user.create({
      data: {
        name: 'Administrator',
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'ADMIN',
        status: 'APPROVED',
      },
      select: { id: true },
    })

    return { created: true }
  }, {
    isolationLevel: 'Serializable',
  })
}
