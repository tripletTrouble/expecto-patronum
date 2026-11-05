import { safeRedirect } from '../utils/safe-redirect'

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'

function requiredRole(path: string): Exclude<Role, 'STUDENT'> | undefined {
  if (path === '/admin' || path.startsWith('/admin/')) return 'ADMIN'
  if (path === '/teacher' || path.startsWith('/teacher/')) return 'TEACHER'
}

export default defineNuxtRouteMiddleware(async (to) => {
  const role = requiredRole(to.path)

  if (!role) return

  try {
    const user = await useRequestFetch()<{ role: Role }>('/api/auth/me')

    if (user.role !== role) {
      return navigateTo({ path: '/', query: { error: 'forbidden' } })
    }
  }
  catch (error: unknown) {
    const statusCode = error && typeof error === 'object' && 'statusCode' in error
      ? (error as { statusCode?: number }).statusCode
      : undefined

    if (statusCode === 401) {
      return navigateTo({
        path: '/login',
        query: { redirect: safeRedirect(to.fullPath) },
      })
    }

    if (statusCode === 403) {
      return navigateTo({ path: '/', query: { error: 'forbidden' } })
    }

    throw error
  }
})
