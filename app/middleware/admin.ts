export default defineNuxtRouteMiddleware(async (to) => {
  const { data, error } = await useFetch<{ role: string }>('/api/auth/me')

  if (error.value?.statusCode === 401) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  if (error.value?.statusCode === 403 || data.value?.role !== 'ADMIN') {
    return navigateTo('/')
  }
})
