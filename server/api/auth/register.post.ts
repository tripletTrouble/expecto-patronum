import { readBody } from 'h3'

import {
  DuplicateStudentEmailError,
  registerStudent,
  studentRegistrationSchema,
} from '../../utils/register-student'
import { enforceRateLimit, RateLimitExceededError } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const result = studentRegistrationSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Data pendaftaran tidak valid',
    })
  }

  try {
    await enforceRateLimit(event, 'studentRegistration', result.data.email)
    const student = await registerStudent(result.data)

    await setUserSession(event, { user: { id: student.id } })

    return student
  }
  catch (error) {
    if (error instanceof RateLimitExceededError) {
      throw createError({ statusCode: 429, statusMessage: 'Too Many Requests', message: error.message })
    }
    if (error instanceof DuplicateStudentEmailError) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: error.message,
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Pendaftaran gagal',
    })
  }
})
