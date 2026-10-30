<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
})

const errorMessage = ref('')
const isSubmitting = ref(false)
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
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password,
      },
    })

    await navigateTo('/')
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
  <main class="min-h-screen bg-gray-50 px-4 py-10 sm:py-16">
    <section class="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          Buat akun siswa
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          Daftar untuk menyimpan riwayat ujian dan mengikuti ujian khusus akun.
        </p>
      </div>

      <form
        class="space-y-5"
        @submit.prevent="submitRegistration"
      >
        <div>
          <label
            for="name"
            class="mb-1 block text-sm font-medium text-gray-700"
          >Nama</label>
          <input
            id="name"
            v-model="form.name"
            name="name"
            type="text"
            autocomplete="name"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
        </div>

        <div>
          <label
            for="email"
            class="mb-1 block text-sm font-medium text-gray-700"
          >Email</label>
          <input
            id="email"
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
        </div>

        <div>
          <label
            for="password"
            class="mb-1 block text-sm font-medium text-gray-700"
          >Kata sandi</label>
          <div class="relative">
            <input
              id="password"
              v-model="form.password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              minlength="8"
              maxlength="128"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-base text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
            <button
              type="button"
              :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
              :aria-pressed="showPassword"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
              @click="showPassword = !showPassword"
            >
              <UIcon
                :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            Minimal 8 karakter.
          </p>
        </div>

        <div>
          <label
            for="passwordConfirmation"
            class="mb-1 block text-sm font-medium text-gray-700"
          >Konfirmasi kata sandi</label>
          <div class="relative">
            <input
              id="passwordConfirmation"
              v-model="form.passwordConfirmation"
              name="passwordConfirmation"
              :type="showPasswordConfirmation ? 'text' : 'password'"
              autocomplete="new-password"
              minlength="8"
              maxlength="128"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-base text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
            <button
              type="button"
              :aria-label="showPasswordConfirmation ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'"
              :aria-pressed="showPasswordConfirmation"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
              @click="showPasswordConfirmation = !showPasswordConfirmation"
            >
              <UIcon
                :name="showPasswordConfirmation ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <p
          v-if="errorMessage"
          role="alert"
          class="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSubmitting ? 'Mendaftarkan...' : 'Daftar' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        Sudah punya akun?
        <NuxtLink
          to="/login"
          class="font-medium text-primary hover:underline"
        >Masuk</NuxtLink>
      </p>
    </section>
  </main>
</template>
