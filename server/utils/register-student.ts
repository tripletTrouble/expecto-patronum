import { Prisma } from '@prisma/client'
import { z } from 'zod'

import { prisma } from './prisma'

export const studentRegistrationSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
  email: z.string().trim().toLowerCase().email('Email tidak valid').max(320, 'Email terlalu panjang'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(128, 'Kata sandi maksimal 128 karakter'),
}).strict()

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>

export type RegisteredStudent = {
  id: string
  name: string
  email: string
  role: 'STUDENT'
  status: 'APPROVED'
}

export class DuplicateStudentEmailError extends Error {
  constructor() {
    super('Email sudah terdaftar')
    this.name = 'DuplicateStudentEmailError'
  }
}

export async function registerStudent(input: StudentRegistrationInput): Promise<RegisteredStudent> {
  const passwordHash = await hashPassword(input.password)

  try {
    const student = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'STUDENT',
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    return { ...student, role: 'STUDENT', status: 'APPROVED' }
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new DuplicateStudentEmailError()
    }

    throw error
  }
}
