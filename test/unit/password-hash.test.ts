import { describe, expect, it } from 'vitest'

describe('nuxt-auth-utils password hashing', () => {
  it('verifies a password with the real helper that generated its hash', async () => {
    const { hashPassword, verifyPassword } = await import('../../node_modules/nuxt-auth-utils/dist/runtime/server/utils/password')
    const password = 'a-strong-development-password'
    const passwordHash = await hashPassword(password)

    await expect(verifyPassword(passwordHash, password)).resolves.toBe(true)
    await expect(verifyPassword(passwordHash, 'the-wrong-password')).resolves.toBe(false)
  })
})
