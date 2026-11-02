<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const { clear } = useUserSession()
const route = useRoute()
const { data: currentUser } = await useFetch<{ name: string, email: string, role: 'ADMIN' | 'TEACHER' | 'STUDENT' }>('/api/auth/me')

const navigationItems: Array<NavigationMenuItem & { roles?: Array<'ADMIN' | 'TEACHER' | 'STUDENT'> }> = [
  {
    label: 'Beranda',
    icon: 'i-lucide-house',
    to: '/',
  },
  {
    label: 'Persetujuan guru',
    icon: 'i-lucide-user-check',
    to: '/admin/teachers',
    roles: ['ADMIN'],
  },
]

const navigation = computed<NavigationMenuItem[][]>(() => [[
  ...navigationItems.filter(item => !item.roles || item.roles.includes(currentUser.value?.role ?? 'STUDENT')),
]])

const pageTitles: Record<string, string> = {
  '/': 'Beranda',
  '/admin/teachers': 'Persetujuan guru',
}

const pageTitle = computed(() => pageTitles[route.path] ?? 'Dashboard')
const userInitials = computed(() => currentUser.value?.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(name => name.charAt(0).toUpperCase())
  .join('') || '?')

const userMenuItems = computed<DropdownMenuItem[][]>(() => [[
  {
    label: currentUser.value?.name ?? 'Pengguna',
    description: currentUser.value?.email ?? '',
    type: 'label',
  },
], [
  {
    label: 'Pengaturan profil (segera hadir)',
    icon: 'i-lucide-user-cog',
    disabled: true,
  },
], [
  {
    label: 'Keluar',
    icon: 'i-lucide-log-out',
    color: 'error',
    onSelect: logout,
  },
]])

useHead({
  bodyAttrs: {
    class: 'dashboard-page',
  },
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div class="grid h-dvh min-h-0 w-full place-items-center overflow-hidden p-3 sm:p-4 lg:p-6">
    <UDashboardGroup class="relative! inset-auto! h-[calc(100dvh-1.5rem)] min-h-0 w-[97vw] overflow-hidden inset-shadow-sm inset-shadow-black/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-2xl shadow-black/10 rounded-2xl sm:h-[calc(100dvh-2rem)] lg:h-[min(calc(100dvh-3rem),56rem)] lg:w-[97vw]">
      <UDashboardSidebar
        collapsible
        :ui="{
          root: 'h-full min-h-0 border-r border-white/20 dark:border-white/10',
          body: 'min-h-0 px-3',
          header: 'border-b border-white/20 dark:border-white/10',
        }"
      >
        <template #header="{ collapsed }">
          <NuxtLink
            to="/"
            class="flex min-w-0 items-center gap-3"
            aria-label="Expecto Patronum, beranda"
          >
            <span
              class="grid size-9 shrink-0 place-items-center rounded-lg rounded-br-sm bg-white font-bold tracking-wider text-indigo-950"
              aria-hidden="true"
            >
              EP
            </span>
            <span
              v-if="!collapsed"
              class="min-w-0"
            >
              <span class="block truncate font-bold text-white">Expecto Patronum</span>
              <span class="block truncate text-xs text-indigo-200">Ruang belajar yang tertata</span>
            </span>
          </NuxtLink>
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu
            :items="navigation[0]"
            :collapsed="collapsed"
            orientation="vertical"
            highlight
            class="mt-4"
          />
        </template>

        <template #footer="{ collapsed }">
          <div class="w-full">
            <UDropdownMenu
              :items="userMenuItems"
              :content="{ side: 'top', align: 'start', sideOffset: 8 }"
              :ui="{ content: 'w-72 bg-[rgb(255_255_255_/_0.08)] backdrop-blur-xl border border-white/16 shadow-xl shadow-black/20', viewport: 'divide-y divide-white/16', separator: 'bg-white/16' }"
            >
              <UButton
                color="neutral"
                variant="ghost"
                :square="collapsed"
                :block="!collapsed"
                class="w-full justify-start text-indigo-100 hover:bg-white/20 bg-white/10 hover:text-white"
                :aria-label="`Menu pengguna ${currentUser?.name ?? ''}`"
              >
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-300 font-semibold text-indigo-950"
                  aria-hidden="true"
                >
                  {{ userInitials }}
                </span>
                <span
                  v-if="!collapsed"
                  class="min-w-0 flex-1 text-left"
                >
                  <span class="block truncate font-medium">{{ currentUser?.name ?? 'Memuat pengguna...' }}</span>
                  <span class="block truncate text-xs text-indigo-200">{{ currentUser?.email ?? '' }}</span>
                </span>
                <UIcon
                  v-if="!collapsed"
                  name="i-lucide-chevrons-up-down"
                  class="size-4 shrink-0 text-indigo-300"
                  aria-hidden="true"
                />
              </UButton>
            </UDropdownMenu>
          </div>
        </template>
      </UDashboardSidebar>

      <UDashboardPanel
        class="min-h-0"
        :ui="{
          body: 'min-h-0 overflow-y-auto',
        }"
      >
        <template #header>
          <UDashboardNavbar
            :title="pageTitle"
            :ui="{
              root: 'border-b border-white/20 dark:border-white/10',
            }"
          >
            <template #leading>
              <UDashboardSidebarCollapse />
            </template>
          </UDashboardNavbar>
        </template>

        <template #body>
          <slot />
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
