import { Prisma } from '@prisma/client'
import { z } from 'zod'

export const registrationSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
  email: z.string().trim().toLowerCase().email('Email tidak valid').max(320, 'Email terlalu panjang'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(128, 'Kata sandi maksimal 128 karakter'),
}).strict()

export type RegistrationInput = z.infer<typeof registrationSchema>

export type RegisteredAccount = {
  id: string
  name: string
  email: string
  role: 'TEACHER' | 'STUDENT'
  status: 'PENDING' | 'APPROVED'
}

export class DuplicateRegistrationEmailError extends Error {
  constructor() {
    super('Email sudah terdaftar')
    this.name = 'DuplicateRegistrationEmailError'
  }
}

export function isDuplicateEmailError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
