<script setup lang="ts">
const route = useRoute()
const appConfig = useAppConfig()

useHead({
  title: `${appConfig.name} - Beranda`,
})
</script>

<template>
  <main class="p-6">
    <UAlert
      v-if="route.query.error === 'forbidden'"
      color="warning"
      variant="soft"
      title="Halaman tidak tersedia"
      description="Peran akunmu tidak memiliki akses ke halaman tersebut."
      role="alert"
    />
  </main>
</template>
