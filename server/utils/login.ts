import type { Role, UserStatus } from '../../prisma/generated/prisma/client'
import { z } from 'zod'

import { prisma } from './prisma'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email tidak valid').max(320, 'Email terlalu panjang'),
  password: z.string().min(1, 'Kata sandi wajib diisi').max(128, 'Kata sandi terlalu panjang'),
}).strict()

export type LoginInput = z.infer<typeof loginSchema>

type LoginUser = {
  id: string
  role: Role
  status: UserStatus
  passwordHash: string
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email atau kata sandi salah')
    this.name = 'InvalidCredentialsError'
  }
}

export class TeacherApprovalError extends Error {
  constructor(public readonly status: 'PENDING' | 'REJECTED') {
    super(status === 'PENDING'
      ? 'Akun guru masih menunggu persetujuan administrator'
      : 'Pendaftaran akun guru ditolak administrator')
    this.name = 'TeacherApprovalError'
  }
}

export async function loginUser(input: LoginInput): Promise<Pick<LoginUser, 'id' | 'role' | 'status'>> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      role: true,
      status: true,
      passwordHash: true,
    },
  }) as LoginUser | null

  if (!user || !await verifyPassword(user.passwordHash, input.password)) {
    throw new InvalidCredentialsError()
  }

  if (user.role === 'TEACHER' && user.status !== 'APPROVED') {
    throw new TeacherApprovalError(user.status)
  }

  if (user.status !== 'APPROVED') {
    throw new InvalidCredentialsError()
  }

  return {
    id: user.id,
    role: user.role,
    status: user.status,
  }
}
