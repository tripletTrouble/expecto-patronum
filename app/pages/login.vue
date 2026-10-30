<script setup lang="ts">
const form = reactive({ email: '', password: '' })
const errorMessage = ref('')
const isSubmitting = ref(false)
const showPassword = ref(false)
const appConfig = useAppConfig()

useHead({
  title: `${appConfig.name} - Masuk`,
})

async function submitLogin() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    })

    await navigateTo('/')
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'data' in error) {
      const response = error.data as { message?: string } | undefined
      errorMessage.value = response?.message ?? 'Login gagal. Silakan coba lagi.'
    }
    else {
      errorMessage.value = 'Login gagal. Silakan coba lagi.'
    }
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="mb-8">
      <h1 class="text-highlighted text-2xl font-bold">
        Masuk ke akun
      </h1>
      <p class="text-muted mt-2 text-sm">
        Akses fitur sesuai dengan peranmu di {{ appConfig.name }}.
      </p>
    </div>

    <UForm
      :state="form"
      class="space-y-5"
      @submit.prevent="submitLogin"
    >
      <UFormField
        label="Email"
        name="email"
        required
        :ui="{ label: 'text-default', description: 'text-muted' }"
      >
        <UInput
          v-model="form.email"
          name="email"
          type="email"
          autocomplete="email"
          required
          variant="outline"
          class="w-full"
          :ui="{ base: 'bg-transparent ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-primary' }"
        />
      </UFormField>

      <UFormField
        label="Kata sandi"
        name="password"
        required
        :ui="{ label: 'text-default', description: 'text-muted' }"
      >
        <UInput
          v-model="form.password"
          name="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          required
          variant="outline"
          class="w-full"
          :ui="{ base: 'bg-transparent ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-primary' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
              :aria-pressed="showPassword"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        :description="errorMessage"
        role="alert"
      />

      <UButton
        type="submit"
        :loading="isSubmitting"
        block
      >
        {{ isSubmitting ? 'Memproses...' : 'Masuk' }}
      </UButton>
    </UForm>

    <p class="text-muted mt-6 text-center text-sm">
      Belum punya akun?
      <UButton
        to="/register"
        variant="link"
        class="p-0 align-baseline"
      >
        Buat akun
      </UButton>
    </p>
  </AuthShell>
</template>
