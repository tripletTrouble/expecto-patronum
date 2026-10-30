import { beforeEach, describe, expect, it, vi } from 'vitest'

import { bootstrapAdmin } from '../../server/utils/bootstrap-admin'

const { create, findFirst, transaction, hashPassword } = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  transaction: vi.fn(),
  hashPassword: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: { $transaction: transaction },
}))

const transactionClient = {
  user: { create, findFirst },
}

describe('bootstrapAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('hashPassword', hashPassword)
    process.env.ADMIN_EMAIL = 'admin@example.test'
    process.env.ADMIN_PASSWORD = 'a-strong-development-password'
    transaction.mockImplementation(async (callback: (client: typeof transactionClient) => unknown) => callback(transactionClient))
    hashPassword.mockResolvedValue('hashed-password')
  })

  it('rejects missing environment variables', async () => {
    delete process.env.ADMIN_EMAIL

    await expect(bootstrapAdmin()).rejects.toThrow('ADMIN_EMAIL')
    expect(transaction).not.toHaveBeenCalled()
  })

  it('rejects invalid environment variables', async () => {
    process.env.ADMIN_EMAIL = 'not-an-email'
    process.env.ADMIN_PASSWORD = 'short'

    await expect(bootstrapAdmin()).rejects.toThrow('valid email address')
    expect(transaction).not.toHaveBeenCalled()
  })

  it('does nothing when an admin already exists', async () => {
    findFirst.mockResolvedValue({ id: 'admin-1' })

    await expect(bootstrapAdmin()).resolves.toEqual({ created: false, reason: 'already_exists' })
    expect(create).not.toHaveBeenCalled()
    expect(hashPassword).not.toHaveBeenCalled()
  })

  it('creates an approved admin with a hashed password', async () => {
    findFirst.mockResolvedValue(null)

    await expect(bootstrapAdmin()).resolves.toEqual({ created: true })
    expect(hashPassword).toHaveBeenCalledWith('a-strong-development-password')
    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Administrator',
        email: 'admin@example.test',
        passwordHash: 'hashed-password',
        role: 'ADMIN',
        status: 'APPROVED',
      },
      select: { id: true },
    })
  })
})
