<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Kategori - Expecto Patronum' })

type Category = { id: string, name: string, createdAt: string, questionCount: number }
type CategoryResponse = { data: Category[] }

const categories = ref<Category[]>([])
const search = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const actionError = ref('')
const name = ref('')
const isCreateModalOpen = ref(false)
const createAgain = ref(true)
const isSubmitting = ref(false)
const editingId = ref<string | null>(null)
const editingName = ref('')
const editingNameElement = ref<HTMLElement | HTMLElement[] | null>(null)
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
    categories.value = (await useRequestFetch()<CategoryResponse>('/api/teacher/categories', {
      query: { search: search.value.trim() || undefined },
    })).data
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

function focusEditingName() {
  const element = Array.isArray(editingNameElement.value)
    ? editingNameElement.value[0]
    : editingNameElement.value
  if (!element) return

  element.focus()
  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
}

function startRename(category: Category) {
  editingId.value = category.id
  editingName.value = category.name
  void nextTick(focusEditingName)
}

function handleCategoryMenuCloseAutoFocus(event: Event) {
  event.preventDefault()
  void nextTick(focusEditingName)
}

function cancelRename() {
  editingId.value = null
  editingName.value = ''
}

function handleRenameKeydown(event: KeyboardEvent, category: Category) {
  if (event.key === 'Enter') {
    event.preventDefault()
    editingName.value = (event.currentTarget as HTMLElement).innerText
    void saveRename(category)
  }
  else if (event.key === 'Escape') {
    event.preventDefault()
    cancelRename()
  }
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
      <div class="flex justify-between gap-5">
        <form
          class="flex w-1/2 gap-2"
          @submit.prevent="loadCategories"
        >
          <UInput
            v-model="search"
            class="flex-1"
            placeholder="Cari kategori berdasarkan nama"
            aria-label="Cari kategori berdasarkan nama"
          />
          <UButton
            type="submit"
            icon="i-lucide-search"
          >
            Cari
          </UButton>
        </form>
        <UButton
          icon="i-lucide-plus"
          @click="openCreateModal"
        >
          Buat
        </UButton>
      </div>
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
        class="h-36 rounded-xl bg-translucent"
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
        {{ search.trim() ? 'Kategori tidak ditemukan' : 'Belum ada kategori' }}
      </p>
      <p class="mt-1 text-sm text-indigo-200">
        {{ search.trim() ? 'Coba gunakan kata kunci lain.' : 'Klik tombol Buat untuk menambahkan kategori pertama.' }}
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
              v-if="editingId === category.id"
              ref="editingNameElement"
              contenteditable="true"
              class="min-w-0 flex-1 rounded-md outline-none focus:ring-2 focus:ring-primary"
              aria-label="Nama kategori"
              role="textbox"
              tabindex="0"
              autofocus
              @keydown="handleRenameKeydown($event, category)"
            >
              {{ category.name }}
            </h2>
            <h2
              v-else
              class="line-clamp-2 min-w-0 flex-1 font-semibold text-white"
              :title="category.name"
            >
              {{ category.name }}
            </h2>
            <UDropdownMenu
              :items="categoryMenuItems(category)"
              :content="{ align: 'end', onCloseAutoFocus: handleCategoryMenuCloseAutoFocus }"
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
