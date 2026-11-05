<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Kategori - Expecto Patronum' })

type Category = { id: string, name: string, createdAt: string, questionCount: number }
type CategoryResponse = { data: Category[] }

const categories = ref<Category[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const actionError = ref('')
const name = ref('')
const isCreateModalOpen = ref(false)
const createAgain = ref(true)
const isSubmitting = ref(false)
const editingId = ref<string | null>(null)
const editingName = ref('')
const activeId = ref('')
const deletingCategory = ref<Category | null>(null)
const isDeleteModalOpen = ref(false)
const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

function errorMessageFrom(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) return (error.data as { message?: string } | undefined)?.message ?? fallback
  return fallback
}

function formatCreatedAt(createdAt: string) {
  return dateFormatter.format(new Date(createdAt))
}

async function loadCategories() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    categories.value = (await useRequestFetch()<CategoryResponse>('/api/teacher/categories')).data
  }
  catch (error: unknown) { errorMessage.value = errorMessageFrom(error, 'Daftar kategori belum dapat dimuat. Silakan coba lagi.') }
  finally { isLoading.value = false }
}

function openCreateModal() {
  actionError.value = ''
  name.value = ''
  isCreateModalOpen.value = true
}

async function addCategory() {
  isSubmitting.value = true
  actionError.value = ''
  try {
    await $fetch('/api/teacher/categories', { method: 'POST', body: { name: name.value } })
    name.value = ''
    await loadCategories()
    if (!createAgain.value) isCreateModalOpen.value = false
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

function categoryMenuItems(category: Category) {
  return [[
    {
      label: 'Ubah nama',
      icon: 'i-lucide-pencil',
      onSelect: () => startRename(category),
    },
    {
      label: 'Hapus',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => requestDelete(category),
    },
  ]]
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
      v-if="actionError && !isCreateModalOpen"
      color="error"
      variant="soft"
      :description="actionError"
      role="alert"
    />

    <AppCard>
      <UPageHeader
        title="Kategori Soal"
        description="Kelola kategori soal berdasarkan bab atau kelas agar lebih mudah dicari saat membuat ujian"
        :ui="{ root: 'p-0', wrapper: 'items-start' }"
      >
        <template #links>
          <UButton
            icon="i-lucide-plus"
            @click="openCreateModal"
          >
            Buat
          </UButton>
        </template>
      </UPageHeader>
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
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
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
        Klik tombol Buat untuk menambahkan kategori pertama.
      </p>
    </AppCard>
    <div
      v-else
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <AppCard
        v-for="category in categories"
        :key="category.id"
        class="flex w-full min-w-0 flex-col"
      >
        <template #header>
          <div class="flex min-w-0 items-start justify-between gap-3">
            <h2
              class="line-clamp-2 min-w-0 flex-1 font-semibold text-white"
              :title="category.name"
            >
              {{ category.name }}
            </h2>
            <UDropdownMenu
              :items="categoryMenuItems(category)"
              :content="{ align: 'end' }"
            >
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-ellipsis-vertical"
                aria-label="Aksi kategori"
                :ui="{ leadingIcon: 'size-5' }"
              />
            </UDropdownMenu>
          </div>
        </template>

        <form
          v-if="editingId === category.id"
          class="flex min-w-0 flex-1 flex-col gap-3"
          @submit.prevent="saveRename(category)"
        >
          <UFormField label="Nama kategori">
            <UInput
              v-model="editingName"
              class="min-w-0"
              aria-label="Nama kategori"
              autofocus
            />
          </UFormField>
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
        <template v-else>
          <div class="mt-auto flex items-center gap-2 text-sm text-indigo-200">
            <span>{{ category.questionCount }} soal aktif</span>
            <span aria-hidden="true">·</span>
            <time
              :datetime="category.createdAt"
              :title="formatCreatedAt(category.createdAt)"
            >
              {{ formatCreatedAt(category.createdAt) }}
            </time>
          </div>
        </template>
      </AppCard>
    </div>

    <UModal
      v-model:open="isCreateModalOpen"
      title="Buat Kategori"
    >
      <template #body>
        <UAlert
          v-if="actionError"
          class="mb-4"
          color="error"
          variant="soft"
          :description="actionError"
          role="alert"
        />
        <UFormField
          label="Nama kategori"
          name="category-name"
          required
        >
          <UInput
            v-model="name"
            name="category-name"
            placeholder="Contoh: Matematika Kelas 10"
            autofocus
            class="w-full"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full items-center justify-between gap-4">
          <UCheckbox
            v-model="createAgain"
            label="Buat lagi"
          />
          <UButton
            :loading="isSubmitting"
            :disabled="!name.trim()"
            @click="addCategory"
          >
            Buat
          </UButton>
        </div>
      </template>
    </UModal>

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
