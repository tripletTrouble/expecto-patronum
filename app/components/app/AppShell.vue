<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { clear } = useUserSession()
const route = useRoute()

const navigation: NavigationMenuItem[][] = [[
  {
    label: 'Beranda',
    icon: 'i-lucide-house',
    to: '/',
  },
  {
    label: 'Persetujuan guru',
    icon: 'i-lucide-user-check',
    to: '/admin/teachers',
  },
]]

const pageTitles: Record<string, string> = {
  '/': 'Beranda',
  '/admin/teachers': 'Persetujuan guru',
}

const pageTitle = computed(() => pageTitles[route.path] ?? 'Dashboard')

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
          root: 'border-r border-white/20 dark:border-white/10',
          body: 'px-3',
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
          <UButton
            icon="i-lucide-log-out"
            :label="collapsed ? undefined : 'Keluar'"
            color="neutral"
            variant="ghost"
            :square="collapsed"
            block
            class="text-indigo-100 hover:bg-black/30 hover:text-white"
            @click="logout"
          />
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
