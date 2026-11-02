import { safeRedirect } from '../utils/safe-redirect'

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'

function requiredRole(path: string): Exclude<Role, 'STUDENT'> | undefined {
  if (path === '/admin' || path.startsWith('/admin/')) return 'ADMIN'
  if (path === '/teacher' || path.startsWith('/teacher/')) return 'TEACHER'
}

export default defineNuxtRouteMiddleware(async (to) => {
  const role = requiredRole(to.path)

  if (!role) return

  const { data, error } = await useFetch<{ role: Role }>('/api/auth/me')

  if (error.value?.statusCode === 401) {
    return navigateTo({
      path: '/login',
      query: { redirect: safeRedirect(to.fullPath) },
    })
  }

  if (error.value?.statusCode === 403 || data.value?.role !== role) {
    return navigateTo({ path: '/', query: { error: 'forbidden' } })
  }
})
