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
    <UDashboardGroup class="!relative !inset-auto h-[calc(100dvh-1.5rem)] min-h-0 w-[97vw] overflow-hidden rounded-2xl border border-muted bg-transparent shadow-[0_1.5rem_4rem_rgb(2_8_23_/_0.35)] sm:h-[calc(100dvh-2rem)] lg:h-[min(calc(100dvh-3rem),56rem)] lg:w-[97vw]">
      <UDashboardSidebar
        collapsible
        :ui="{
          root: ' backdrop-blur-sm border-r ',
          body: 'px-3',
        }"
      >
        <template #header="{ collapsed }">
          <NuxtLink
            to="/"
            class="flex min-w-0 items-center gap-3"
            aria-label="Expecto Patronum, beranda"
          >
            <span
              class="grid size-9 shrink-0 place-items-center rounded-lg rounded-br-sm bg-rose-400 font-bold tracking-wider text-indigo-950"
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
        class="min-h-0 backdrop-blur-sm"
        :ui="{
          root: 'border-l border-black/30',
          body: 'min-h-0 overflow-y-auto bg-transparent',
        }"
      >
        <template #header>
          <UDashboardNavbar
            :title="pageTitle"
            class=" backdrop-blur-sm"
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
