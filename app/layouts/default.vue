<script setup lang="ts">
const { loggedIn, clear } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div>
    <header
      v-if="loggedIn"
      class="flex justify-end px-4 py-3"
    >
      <button
        class="text-sm font-medium text-gray-700 hover:text-primary"
        @click="logout"
      >
        Keluar
      </button>
    </header>
    <slot />
  </div>
</template>
