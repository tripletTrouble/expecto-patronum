import { readBody } from 'h3'

import {
  InvalidCredentialsError,
  loginSchema,
  loginUser,
  TeacherApprovalError,
} from '../../utils/login'

export default defineEventHandler(async (event) => {
  const result = loginSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Email atau kata sandi tidak valid',
    })
  }

  try {
    const user = await loginUser(result.data)

    await setUserSession(event, { user: { id: user.id } })

    return { success: true }
  }
  catch (error) {
    if (error instanceof TeacherApprovalError) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: error.message,
      })
    }

    if (error instanceof InvalidCredentialsError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: error.message,
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Login gagal',
    })
  }
})
