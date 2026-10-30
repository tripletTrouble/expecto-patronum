import { prisma } from './prisma'
import {
  DuplicateRegistrationEmailError,
  isDuplicateEmailError,
  registrationSchema,
} from './register'
import type { RegistrationInput } from './register'

export const studentRegistrationSchema = registrationSchema
export type StudentRegistrationInput = RegistrationInput

export type RegisteredStudent = {
  id: string
  name: string
  email: string
  role: 'STUDENT'
  status: 'APPROVED'
}

export class DuplicateStudentEmailError extends DuplicateRegistrationEmailError {
  constructor() {
    super()
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
    if (isDuplicateEmailError(error)) {
      throw new DuplicateStudentEmailError()
    }

    throw error
  }
}
