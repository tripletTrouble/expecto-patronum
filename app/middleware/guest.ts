type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'

type AuthError = {
  statusCode?: number
}

export default defineNuxtRouteMiddleware(async () => {
  try {
    const user = await useRequestFetch()<{ role: Role }>('/api/auth/me')
    const dashboard = user.role === 'ADMIN' ? '/admin' : user.role === 'TEACHER' ? '/teacher' : '/'

    return navigateTo(dashboard)
  }
  catch (error: unknown) {
    const statusCode = error && typeof error === 'object' && 'statusCode' in error
      ? (error as AuthError).statusCode
      : undefined

    if (statusCode === 401) return
    throw error
  }
})
