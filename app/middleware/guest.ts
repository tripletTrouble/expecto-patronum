export default defineNuxtRouteMiddleware(async () => {
  const { data } = await useFetch<{ role: 'ADMIN' | 'TEACHER' | 'STUDENT' }>('/api/auth/me')

  if (!data.value) return

  const dashboard = data.value.role === 'ADMIN' ? '/admin' : data.value.role === 'TEACHER' ? '/teacher' : '/'

  return navigateTo(dashboard)
})
