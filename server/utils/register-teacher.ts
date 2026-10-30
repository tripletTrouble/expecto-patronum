import { prisma } from './prisma'
import {
  DuplicateRegistrationEmailError,
  isDuplicateEmailError,
  registrationSchema,
} from './register'

export const teacherRegistrationSchema = registrationSchema
export type TeacherRegistrationInput = ReturnType<typeof teacherRegistrationSchema.parse>

export type RegisteredTeacher = {
  id: string
  name: string
  email: string
  role: 'TEACHER'
  status: 'PENDING'
}

export async function registerTeacher(input: TeacherRegistrationInput): Promise<RegisteredTeacher> {
  const passwordHash = await hashPassword(input.password)

  try {
    const teacher = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'TEACHER',
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    return { ...teacher, role: 'TEACHER', status: 'PENDING' }
  }
  catch (error) {
    if (isDuplicateEmailError(error)) {
      throw new DuplicateRegistrationEmailError()
    }

    throw error
  }
}
