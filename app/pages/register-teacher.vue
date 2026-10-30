<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
})

const errorMessage = ref('')
const isSubmitting = ref(false)
const registrationComplete = ref(false)
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)
const appConfig = useAppConfig()

useHead({
  title: `${appConfig.name} - Pendaftaran Guru`,
})

async function submitRegistration() {
  errorMessage.value = ''

  if (form.password !== form.passwordConfirmation) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/auth/register-teacher', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password,
      },
    })

    registrationComplete.value = true
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'data' in error) {
      const response = error.data as { message?: string } | undefined
      errorMessage.value = response?.message ?? 'Pendaftaran gagal. Silakan coba lagi.'
    }
    else {
      errorMessage.value = 'Pendaftaran gagal. Silakan coba lagi.'
    }
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div
      v-if="registrationComplete"
      class="text-center"
    >
      <h1 class="text-highlighted text-2xl font-bold">
        Pendaftaran guru berhasil
      </h1>
      <p class="text-muted mt-3 text-sm leading-6">
        Akunmu sedang menunggu persetujuan administrator. Setelah disetujui, kamu dapat masuk dan menggunakan fitur guru.
      </p>
      <UButton
        to="/login"
        variant="link"
        class="mt-6"
      >
        Kembali ke halaman masuk
      </UButton>
    </div>

    <template v-else>
      <div class="mb-6">
        <h1 class="text-highlighted text-2xl font-bold">
          Daftar sebagai guru
        </h1>
        <p class="text-muted mt-2 text-sm leading-6">
          Akun guru perlu disetujui administrator sebelum dapat digunakan untuk masuk dan mengakses fitur guru.
        </p>
      </div>

      <UForm
        :state="form"
        class="space-y-5"
        @submit.prevent="submitRegistration"
      >
        <UFormField
          label="Nama"
          name="name"
          required
          :ui="{ label: 'text-default' }"
        >
          <UInput
            v-model="form.name"
            name="name"
            type="text"
            autocomplete="name"
            required
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Email"
          name="email"
          required
          :ui="{ label: 'text-default' }"
        >
          <UInput
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Kata sandi"
          name="password"
          required
          :ui="{ label: 'text-default' }"
        >
          <UInput
            v-model="form.password"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            minlength="8"
            maxlength="128"
            required
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField
          label="Konfirmasi kata sandi"
          name="passwordConfirmation"
          required
          :ui="{ label: 'text-default' }"
        >
          <UInput
            v-model="form.passwordConfirmation"
            name="passwordConfirmation"
            :type="showPasswordConfirmation ? 'text' : 'password'"
            autocomplete="new-password"
            minlength="8"
            maxlength="128"
            required
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                :aria-label="showPasswordConfirmation ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                :icon="showPasswordConfirmation ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="showPasswordConfirmation = !showPasswordConfirmation"
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
          {{ isSubmitting ? 'Mendaftarkan...' : 'Daftar sebagai guru' }}
        </UButton>
      </UForm>

      <p class="text-muted mt-6 text-center text-sm">
        Sudah punya akun?
        <UButton
          to="/login"
          variant="link"
          class="p-0 align-baseline"
        >
          Masuk
        </UButton>
      </p>
    </template>
  </AuthShell>
</template>
