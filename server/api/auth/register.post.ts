import { readBody } from 'h3'

import {
  DuplicateStudentEmailError,
  registerStudent,
  studentRegistrationSchema,
} from '../../utils/register-student'

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
    const student = await registerStudent(result.data)

    await setUserSession(event, { user: { id: student.id } })

    return student
  }
  catch (error) {
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
