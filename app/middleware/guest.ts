export default defineNuxtRouteMiddleware(async () => {
  const { data } = await useFetch<{ role: 'ADMIN' | 'TEACHER' | 'STUDENT' }>('/api/auth/me')

  if (!data.value) return

  return navigateTo(data.value.role === 'ADMIN' ? '/admin/teachers' : '/')
})
