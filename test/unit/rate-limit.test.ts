import { beforeEach, describe, expect, it, vi } from 'vitest'

import { enforceRateLimit, RateLimitExceededError } from '../../server/utils/rate-limit'

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
})
