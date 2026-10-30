<script setup lang="ts">
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
      <h1 class="text-2xl font-bold text-gray-900">
        Pendaftaran guru berhasil
      </h1>
      <p class="mt-3 text-sm leading-6 text-gray-600">
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
        <h1 class="text-2xl font-bold text-gray-900">
          Buat akun
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          Pilih jenis akun yang ingin kamu daftarkan.
        </p>
      </div>

      <UButtonGroup
        class="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1"
        role="tablist"
        aria-label="Jenis akun"
      >
        <UButton
          type="button"
          role="tab"
          :aria-selected="registrationType === 'student'"
          :color="registrationType === 'student' ? 'primary' : 'neutral'"
          :variant="registrationType === 'student' ? 'solid' : 'ghost'"
          @click="registrationType = 'student'"
        >
          Daftar sebagai siswa
        </UButton>
        <UButton
          type="button"
          role="tab"
          :aria-selected="registrationType === 'teacher'"
          :color="registrationType === 'teacher' ? 'primary' : 'neutral'"
          :variant="registrationType === 'teacher' ? 'solid' : 'ghost'"
          @click="registrationType = 'teacher'"
        >
          Daftar sebagai guru
        </UButton>
      </UButtonGroup>

      <UAlert
        v-if="registrationType === 'teacher'"
        color="info"
        variant="soft"
        description="Akun guru perlu disetujui oleh administrator sebelum dapat digunakan untuk masuk dan mengakses fitur guru."
        role="alert"
        class="mb-6"
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
          :ui="{ label: 'text-gray-700', description: 'text-gray-600' }"
        >
          <UInput
            v-model="form.name"
            name="name"
            type="text"
            autocomplete="name"
            required
            variant="outline"
            class="w-full"
            :ui="{ base: 'bg-white ring-1 ring-gray-300 focus-visible:ring-2 focus-visible:ring-primary' }"
          />
        </UFormField>

        <UFormField
          label="Email"
          name="email"
          required
          :ui="{ label: 'text-gray-700', description: 'text-gray-600' }"
        >
          <UInput
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            required
            variant="outline"
            class="w-full"
            :ui="{ base: 'bg-white ring-1 ring-gray-300 focus-visible:ring-2 focus-visible:ring-primary' }"
          />
        </UFormField>

        <UFormField
          label="Kata sandi"
          name="password"
          description="Minimal 8 karakter."
          required
          :ui="{ label: 'text-gray-700', description: 'text-gray-600' }"
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
            :ui="{ base: 'bg-white ring-1 ring-gray-300 focus-visible:ring-2 focus-visible:ring-primary' }"
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

        <UFormField
          label="Konfirmasi kata sandi"
          name="passwordConfirmation"
          required
          :ui="{ label: 'text-gray-700', description: 'text-gray-600' }"
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
            :ui="{ base: 'bg-white ring-1 ring-gray-300 focus-visible:ring-2 focus-visible:ring-primary' }"
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

      <p class="mt-6 text-center text-sm text-gray-600">
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
