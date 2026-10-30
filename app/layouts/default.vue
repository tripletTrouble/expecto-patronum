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
    <UContainer
      v-if="loggedIn"
      as="header"
      class="flex justify-end px-4 py-3"
    >
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        @click="logout"
      >
        Keluar
      </UButton>
    </UContainer>
    <slot />
  </div>
</template>
