import { readBody } from 'h3'

import {
  DuplicateRegistrationEmailError,
  registrationSchema,
} from '../../utils/register'
import { registerTeacher } from '../../utils/register-teacher'

export default defineEventHandler(async (event) => {
  const result = registrationSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Data pendaftaran tidak valid',
    })
  }

  try {
    return await registerTeacher(result.data)
  }
  catch (error) {
    if (error instanceof DuplicateRegistrationEmailError) {
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
