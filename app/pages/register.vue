<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
})

const errorMessage = ref('')
const isSubmitting = ref(false)

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
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
        </div>

        <div>
          <label
            for="password"
            class="mb-1 block text-sm font-medium text-gray-700"
          >Kata sandi</label>
          <input
            id="password"
            v-model="form.password"
            name="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="128"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
          <p class="mt-1 text-xs text-gray-500">
            Minimal 8 karakter.
          </p>
        </div>

        <div>
          <label
            for="passwordConfirmation"
            class="mb-1 block text-sm font-medium text-gray-700"
          >Konfirmasi kata sandi</label>
          <input
            id="passwordConfirmation"
            v-model="form.passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="128"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
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
          class="w-full rounded-md bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSubmitting ? 'Mendaftarkan...' : 'Daftar' }}
        </button>
      </form>
    </section>
  </main>
</template>
