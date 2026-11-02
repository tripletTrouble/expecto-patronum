import { Prisma } from '../../prisma/generated/prisma/client'
import { getRequestIP, type H3Event } from 'h3'
import { isIP } from 'node:net'

import { prisma } from './prisma'

export const rateLimitConfig = {
  login: {
    email: { limit: 5, windowMs: 15 * 60 * 1000 },
    ip: { limit: 100, windowMs: 15 * 60 * 1000 },
  },
  studentRegistration: {
    email: { limit: 3, windowMs: 60 * 60 * 1000 },
    ip: { limit: 50, windowMs: 60 * 60 * 1000 },
  },
  teacherRegistration: {
    email: { limit: 3, windowMs: 60 * 60 * 1000 },
    ip: { limit: 50, windowMs: 60 * 60 * 1000 },
  },
} as const

export type RateLimitAction = keyof typeof rateLimitConfig

export class RateLimitExceededError extends Error {
  constructor() {
    super('Terlalu banyak percobaan. Silakan coba lagi nanti.')
    this.name = 'RateLimitExceededError'
  }
}

export class RateLimitUnavailableError extends Error {
  constructor() {
    super('Layanan sedang sibuk. Silakan coba lagi.')
    this.name = 'RateLimitUnavailableError'
  }
}

function getClientIp(event: H3Event): string | undefined {
  // The deployment adapter supplies the trusted client address through H3's event context.
  const ip = getRequestIP(event)
  return ip && isIP(ip) > 0 ? ip : undefined
}

async function consumeOnce(key: string, limit: number, windowMs: number, now: Date): Promise<boolean> {
  const windowStart = new Date(now.getTime() - (now.getTime() % windowMs))

  return prisma.$transaction(async (transaction) => {
    const counter = await transaction.rateLimitCounter.findUnique({ where: { key } })

    if (!counter || counter.windowStart.getTime() !== windowStart.getTime()) {
      await transaction.rateLimitCounter.upsert({
        where: { key },
        create: { key, count: 1, windowStart },
        update: { count: 1, windowStart },
      })
      return true
    }

    if (counter.count >= limit) {
      return false
    }

    await transaction.rateLimitCounter.update({
      where: { key },
      data: { count: { increment: 1 } },
    })
    return true
  }, { isolationLevel: 'Serializable' })
}

async function consume(key: string, limit: number, windowMs: number, now: Date): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await consumeOnce(key, limit, windowMs, now)
    }
    catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') {
        throw error
      }
      if (attempt === 2) {
        throw new RateLimitUnavailableError()
      }
    }
  }

  throw new RateLimitUnavailableError()
}

export async function enforceRateLimit(
  event: H3Event,
  action: RateLimitAction,
  email: string,
  now = new Date(),
): Promise<void> {
  const config = rateLimitConfig[action]
  const emailAllowed = await consume(`${action}:email:${email}`, config.email.limit, config.email.windowMs, now)

  if (!emailAllowed) {
    throw new RateLimitExceededError()
  }

  const ip = getClientIp(event)
  if (ip && !await consume(`${action}:ip:${ip}`, config.ip.limit, config.ip.windowMs, now)) {
    throw new RateLimitExceededError()
  }
}
