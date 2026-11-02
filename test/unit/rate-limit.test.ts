import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Prisma } from '../../prisma/generated/prisma/client'
import { getRequestIP } from 'h3'
import { enforceRateLimit, RateLimitExceededError, RateLimitUnavailableError } from '../../server/utils/rate-limit'

const { findUnique, upsert, update, transaction } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    $transaction: transaction,
  },
}))

vi.mock('h3', () => ({
  getRequestIP: vi.fn(() => undefined),
}))

describe('authentication rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestIP).mockReturnValue(undefined)
    transaction.mockImplementation(async (callback: (client: unknown) => Promise<boolean>) => callback({
      rateLimitCounter: { findUnique, upsert, update },
    }))
    findUnique.mockResolvedValue(null)
    upsert.mockResolvedValue(undefined)
    update.mockResolvedValue(undefined)
  })

  it('allows requests under the email limit', async () => {
    await expect(enforceRateLimit({} as never, 'login', 'user@example.test', new Date('2026-11-02T00:00:00Z'))).resolves.toBeUndefined()
    expect(upsert).toHaveBeenCalledTimes(1)
  })

  it('rejects requests at the email limit', async () => {
    findUnique.mockResolvedValue({ count: 5, windowStart: new Date('2026-11-02T00:00:00Z') })

    await expect(enforceRateLimit({} as never, 'login', 'user@example.test', new Date('2026-11-02T00:00:00Z')))
      .rejects.toBeInstanceOf(RateLimitExceededError)
  })

  it('starts a new window after the current one expires', async () => {
    findUnique.mockResolvedValue({ count: 5, windowStart: new Date('2026-11-02T00:00:00Z') })

    await expect(enforceRateLimit({} as never, 'login', 'user@example.test', new Date('2026-11-02T00:16:00Z'))).resolves.toBeUndefined()
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ count: 1 }),
    }))
  })

  it('does not enable forwarded-header parsing for the IP safeguard', async () => {
    vi.mocked(getRequestIP).mockReturnValue('192.0.2.1')

    await enforceRateLimit({} as never, 'login', 'user@example.test')

    expect(getRequestIP).toHaveBeenCalledWith({})
    expect(upsert).toHaveBeenCalledTimes(2)
  })

  it('retries serialization conflicts and succeeds', async () => {
    transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Serialization conflict', {
      code: 'P2034', clientVersion: '7.10.1',
    }))

    await expect(enforceRateLimit({} as never, 'login', 'user@example.test')).resolves.toBeUndefined()
    expect(transaction).toHaveBeenCalledTimes(2)
  })

  it('returns a controlled error after repeated serialization conflicts', async () => {
    transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Serialization conflict', {
      code: 'P2034', clientVersion: '7.10.1',
    }))

    await expect(enforceRateLimit({} as never, 'login', 'user@example.test'))
      .rejects.toBeInstanceOf(RateLimitUnavailableError)
    expect(transaction).toHaveBeenCalledTimes(3)
  })
})
