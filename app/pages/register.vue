<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
})

const registrationType = ref<'student' | 'teacher'>('student')
const errorMessage = ref('')
const isSubmitting = ref(false)
const teacherRegistrationComplete = ref(false)
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

const appConfig = useAppConfig()

useHead({
  title: `${appConfig.name} - Daftar`,
})

const nameError = computed(() => {
  const name = form.name.trim()

  if (!form.name) {
    return undefined
  }

  if (!name) {
    return 'Nama wajib diisi.'
  }

  if (name.length > 100) {
    return 'Nama terlalu panjang.'
  }

  return undefined
})

const emailError = computed(() => {
  if (!form.email) {
    return undefined
  }

  const email = form.email.trim()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  if (!isValidEmail) {
    return 'Email tidak valid.'
  }

  if (email.length > 320) {
    return 'Email terlalu panjang.'
  }

  return undefined
})

const passwordError = computed(() => {
  if (!form.password || form.password.length >= 8) {
    return undefined
  }

  return 'Password minimal 8 karakter.'
})

const passwordConfirmationError = computed(() => {
  if (!form.passwordConfirmation || form.password === form.passwordConfirmation) {
    return undefined
  }

  return 'Password dan konfirmasi password tidak sama.'
})

const registrationTabs = [
  {
    label: 'Daftar sebagai siswa',
    value: 'student',
  },
  {
    label: 'Daftar sebagai guru',
    value: 'teacher',
  },
] satisfies TabsItem[]

async function submitRegistration() {
  errorMessage.value = ''

  if (form.password !== form.passwordConfirmation) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  isSubmitting.value = true

  try {
    await $fetch(registrationType.value === 'teacher' ? '/api/auth/register-teacher' : '/api/auth/register', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password,
      },
    })

    if (registrationType.value === 'teacher') {
      teacherRegistrationComplete.value = true
    }
    else {
      await navigateTo('/')
    }
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
      v-if="teacherRegistrationComplete"
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
      <UAlert
        :class="{ invisible: registrationType !== 'teacher' }"
        color="warning"
        variant="soft"
        icon="i-lucide-info"
        description="Akun guru perlu disetujui oleh administrator sebelum dapat digunakan untuk masuk dan mengakses fitur guru."
        role="alert"
        :aria-hidden="registrationType !== 'teacher'"
        class="mb-6"
      />

      <div class="mb-6">
        <h1 class="text-highlighted text-2xl font-bold">
          Buat akun
        </h1>
        <p class="text-muted mt-2 text-sm">
          Pilih jenis akun yang ingin kamu daftarkan.
        </p>
      </div>

      <UTabs
        v-model="registrationType"
        :items="registrationTabs"
        color="primary"
        variant="pill"
        :content="false"
        :ui="{ list: 'w-full', trigger: 'grow' }"
        class="mb-6 w-full"
      />

      <UForm
        :state="form"
        class="space-y-5"
        @submit.prevent="submitRegistration"
      >
        <UFormField
          label="Nama"
          name="name"
          required
          :ui="{ label: 'text-default', description: 'text-muted' }"
        >
          <UInput
            v-model="form.name"
            name="name"
            type="text"
            autocomplete="name"
            required
            variant="outline"
            class="w-full"
            :ui="{ base: 'bg-transparent ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-primary' }"
          />
          <p
            class="min-h-4 text-xs leading-4 text-error"
            aria-live="polite"
          >
            {{ nameError ?? ' ' }}
          </p>
        </UFormField>

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
          <p
            class="min-h-4 text-xs leading-4 text-error"
            aria-live="polite"
          >
            {{ emailError ?? ' ' }}
          </p>
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
            autocomplete="new-password"
            minlength="8"
            maxlength="128"
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
          <p
            class="min-h-4 text-xs leading-4 text-error"
            aria-live="polite"
          >
            {{ passwordError ?? ' ' }}
          </p>
        </UFormField>

        <UFormField
          label="Konfirmasi kata sandi"
          name="passwordConfirmation"
          required
          :ui="{ label: 'text-default', description: 'text-muted' }"
        >
          <UInput
            v-model="form.passwordConfirmation"
            name="passwordConfirmation"
            :type="showPasswordConfirmation ? 'text' : 'password'"
            autocomplete="new-password"
            minlength="8"
            maxlength="128"
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
                :aria-label="showPasswordConfirmation ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'"
                :aria-pressed="showPasswordConfirmation"
                :icon="showPasswordConfirmation ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="showPasswordConfirmation = !showPasswordConfirmation"
              />
            </template>
          </UInput>
          <p
            class="min-h-4 text-xs leading-4 text-error"
            aria-live="polite"
          >
            {{ passwordConfirmationError ?? ' ' }}
          </p>
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
          {{ isSubmitting ? 'Mendaftarkan...' : 'Daftar' }}
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
