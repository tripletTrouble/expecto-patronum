<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Kategori - Expecto Patronum' })

type Category = { id: string, name: string, questionCount: number }
type CategoryResponse = { data: Category[] }

const categories = ref<Category[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const actionError = ref('')
const name = ref('')
const isSubmitting = ref(false)
const editingId = ref<string | null>(null)
const editingName = ref('')
const activeId = ref('')
const deletingCategory = ref<Category | null>(null)
const isDeleteModalOpen = ref(false)

function errorMessageFrom(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) return (error.data as { message?: string } | undefined)?.message ?? fallback
  return fallback
}

async function loadCategories() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    categories.value = (await $fetch<CategoryResponse>('/api/teacher/categories')).data
  }
  catch (error: unknown) { errorMessage.value = errorMessageFrom(error, 'Daftar kategori belum dapat dimuat. Silakan coba lagi.') }
  finally { isLoading.value = false }
}

async function addCategory() {
  isSubmitting.value = true
  actionError.value = ''
  try {
    await $fetch('/api/teacher/categories', { method: 'POST', body: { name: name.value } })
    name.value = ''
    await loadCategories()
  }
  catch (error: unknown) { actionError.value = errorMessageFrom(error, 'Kategori belum dapat ditambahkan. Silakan coba lagi.') }
  finally { isSubmitting.value = false }
}

function startRename(category: Category) {
  editingId.value = category.id
  editingName.value = category.name
}
function cancelRename() {
  editingId.value = null
  editingName.value = ''
}

async function saveRename(category: Category) {
  activeId.value = category.id
  actionError.value = ''
  try {
    await $fetch(`/api/teacher/categories/${category.id}`, { method: 'PATCH', body: { name: editingName.value } })
    cancelRename()
    await loadCategories()
  }
  catch (error: unknown) { actionError.value = errorMessageFrom(error, 'Nama kategori belum dapat diubah. Silakan coba lagi.') }
  finally { activeId.value = '' }
}

function requestDelete(category: Category) {
  deletingCategory.value = category
  isDeleteModalOpen.value = true
}
function cancelDelete() {
  isDeleteModalOpen.value = false
  deletingCategory.value = null
}

async function confirmDelete() {
  const category = deletingCategory.value
  if (!category) return
  cancelDelete()
  activeId.value = category.id
  actionError.value = ''
  try {
    await $fetch(`/api/teacher/categories/${category.id}`, { method: 'DELETE' })
    await loadCategories()
  }
  catch (error: unknown) { actionError.value = errorMessageFrom(error, 'Kategori belum dapat dihapus. Silakan coba lagi.') }
  finally { activeId.value = '' }
}

await loadCategories()
</script>

<template>
  <section class="space-y-5">
    <UAlert
      v-if="actionError"
      color="error"
      variant="soft"
      :description="actionError"
      role="alert"
    />
    <AppCard>
      <form
        class="flex flex-col gap-3 sm:flex-row"
        @submit.prevent="addCategory"
      >
        <UInput
          v-model="name"
          class="min-w-0 flex-1"
          placeholder="Nama kategori baru"
          aria-label="Nama kategori baru"
        />
        <UButton
          type="submit"
          icon="i-lucide-plus"
          :loading="isSubmitting"
        >
          Tambah kategori
        </UButton>
      </form>
    </AppCard>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :description="errorMessage"
      role="alert"
    />
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Memuat kategori"
    >
      <USkeleton
        v-for="index in 4"
        :key="index"
        class="h-36 rounded-xl"
      />
    </div>
    <AppCard
      v-else-if="categories.length === 0"
      class="text-center"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="mx-auto mb-3 size-8 text-indigo-200"
        aria-hidden="true"
      />
      <p class="font-medium text-white">
        Belum ada kategori
      </p>
      <p class="mt-1 text-sm text-indigo-200">
        Tambahkan kategori untuk mengelompokkan soal Anda.
      </p>
    </AppCard>
    <div
      v-else
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <AppCard
        v-for="category in categories"
        :key="category.id"
        class="flex min-w-0 flex-col"
      >
        <template v-if="editingId === category.id">
          <form
            class="flex min-w-0 flex-1 flex-col gap-3"
            @submit.prevent="saveRename(category)"
          >
            <UInput
              v-model="editingName"
              class="min-w-0"
              aria-label="Nama kategori"
              autofocus
            />
            <div class="mt-auto flex gap-2">
              <UButton
                type="submit"
                size="sm"
                :loading="activeId === category.id"
              >
                Simpan
              </UButton>
              <UButton
                type="button"
                size="sm"
                color="neutral"
                variant="ghost"
                @click="cancelRename"
              >
                Batal
              </UButton>
            </div>
          </form>
        </template>
        <template v-else>
          <div class="min-w-0 flex-1">
            <h2 class="break-words font-semibold text-white">
              {{ category.name }}
            </h2>
            <p class="mt-2 text-sm text-indigo-200">
              {{ category.questionCount }} soal aktif
            </p>
          </div>
          <div class="mt-5 flex flex-wrap gap-2">
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              @click="startRename(category)"
            >
              Ubah nama
            </UButton>
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              :loading="activeId === category.id"
              @click="requestDelete(category)"
            >
              Hapus
            </UButton>
          </div>
        </template>
      </AppCard>
    </div>

    <UModal
      v-model:open="isDeleteModalOpen"
      title="Hapus kategori"
    >
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Yakin ingin menghapus kategori “{{ deletingCategory?.name }}”? Soal yang sudah dihapus akan dilepas dari kategori.
        </p>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="cancelDelete"
        >
          Batal
        </UButton>
        <UButton
          color="error"
          @click="confirmDelete"
        >
          Hapus kategori
        </UButton>
      </template>
    </UModal>
  </section>
</template>
