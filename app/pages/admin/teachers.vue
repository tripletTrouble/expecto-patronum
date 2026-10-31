<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Persetujuan guru - Expecto Patronum',
})

type PendingTeacher = {
  id: string
  name: string
  email: string
  createdAt: string
}

type PendingTeachersResponse = {
  data: PendingTeacher[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const teachers = ref<PendingTeacher[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const actionError = ref('')
const activeTeacherId = ref('')
const router = useRouter()

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
})

function formatRegistrationDate(date: string) {
  return dateFormatter.format(new Date(date))
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) {
    const response = error.data as { message?: string } | undefined
    return response?.message ?? fallback
  }

  return fallback
}

async function loadPendingTeachers() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<PendingTeachersResponse>('/api/admin/teachers/pending')
    teachers.value = response.data
  }
  catch (error: unknown) {
    const statusCode = error && typeof error === 'object' && 'statusCode' in error
      ? error.statusCode
      : undefined

    if (statusCode === 401) {
      await router.replace('/login')
      return
    }

    if (statusCode === 403) {
      await router.replace('/')
      return
    }

    errorMessage.value = getErrorMessage(error, 'Daftar guru belum dapat dimuat. Silakan coba lagi.')
  }
  finally {
    isLoading.value = false
  }
}

async function changeTeacherStatus(teacher: PendingTeacher, status: 'approve' | 'reject') {
  if (status === 'reject' && !window.confirm(`Tolak pendaftaran ${teacher.name}?`)) {
    return
  }

  activeTeacherId.value = teacher.id
  actionError.value = ''

  try {
    await $fetch(`/api/admin/teachers/${teacher.id}/${status}`, { method: 'POST' })
    teachers.value = teachers.value.filter(item => item.id !== teacher.id)
  }
  catch (error: unknown) {
    actionError.value = getErrorMessage(error, 'Perubahan status guru gagal. Silakan coba lagi.')
  }
  finally {
    activeTeacherId.value = ''
  }
}

await loadPendingTeachers()
</script>

<template>
  <section class="approval-page">
    <header class="approval-page__header">
      <div>
        <p class="approval-page__eyebrow">
          Ruang administrator
        </p>
        <h1 class="approval-page__title">
          Persetujuan guru
        </h1>
        <p class="approval-page__intro">
          Tinjau pendaftaran guru sebelum mereka mulai mengelola kelas dan ujian.
        </p>
      </div>
      <div
        v-if="!isLoading"
        class="approval-page__count"
        aria-live="polite"
      >
        <strong>{{ teachers.length }}</strong>
        <span>menunggu tinjauan</span>
      </div>
    </header>

    <UAlert
      v-if="actionError"
      class="approval-page__alert"
      color="error"
      variant="soft"
      :description="actionError"
      role="alert"
    />

    <div
      v-if="isLoading"
      class="approval-page__state"
      role="status"
      aria-live="polite"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="approval-page__state-icon animate-spin"
        aria-hidden="true"
      />
      <p>Memuat pendaftaran guru...</p>
    </div>

    <UAlert
      v-else-if="errorMessage"
      color="error"
      variant="soft"
      :description="errorMessage"
      role="alert"
    >
      <template #actions>
        <UButton
          size="sm"
          color="error"
          variant="outline"
          @click="loadPendingTeachers"
        >
          Coba lagi
        </UButton>
      </template>
    </UAlert>

    <div
      v-else-if="teachers.length === 0"
      class="approval-page__state approval-page__state--empty"
    >
      <span
        class="approval-page__empty-mark"
        aria-hidden="true"
      >✓</span>
      <h2>
        Tidak ada guru yang menunggu persetujuan
      </h2>
      <p>
        Pendaftaran baru akan muncul di sini setelah dikirim.
      </p>
    </div>

    <div
      v-else
      class="approval-page__list"
    >
      <article
        v-for="teacher in teachers"
        :key="teacher.id"
        class="approval-card"
      >
        <div class="approval-card__identity">
          <div
            class="approval-card__avatar"
            aria-hidden="true"
          >
            {{ teacher.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="approval-card__name">
              {{ teacher.name }}
            </h2>
            <p class="approval-card__email">
              {{ teacher.email }}
            </p>
          </div>
        </div>

        <div class="approval-card__details">
          <span class="approval-card__label">Mendaftar</span>
          <time :datetime="teacher.createdAt">
            {{ formatRegistrationDate(teacher.createdAt) }}
          </time>
        </div>

        <div class="approval-card__actions">
          <UButton
            color="primary"
            :loading="activeTeacherId === teacher.id"
            :disabled="Boolean(activeTeacherId)"
            @click="changeTeacherStatus(teacher, 'approve')"
          >
            Setujui
          </UButton>
          <UButton
            color="error"
            variant="soft"
            :loading="activeTeacherId === teacher.id"
            :disabled="Boolean(activeTeacherId)"
            @click="changeTeacherStatus(teacher, 'reject')"
          >
            Tolak
          </UButton>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.approval-page {
  max-width: 58rem;
  margin: 0 auto;
}

.approval-page__header {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.approval-page__eyebrow {
  margin: 0 0 0.5rem;
  color: #a5b4fc;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.approval-page__title {
  margin: 0;
  color: #f8fafc;
  font-family: Georgia, serif;
  font-size: clamp(2rem, 6vw, 3.5rem);
  line-height: 1;
}

.approval-page__intro {
  max-width: 36rem;
  margin: 1rem 0 0;
  color: #cbd5e1;
  line-height: 1.6;
}

.approval-page__count {
  display: grid;
  flex: 0 0 auto;
  gap: 0.15rem;
  min-width: 7rem;
  padding: 0.8rem 1rem;
  color: #c7d2fe;
  text-align: right;
  border-right: 3px solid #fb7185;
}

.approval-page__count strong {
  color: #fff;
  font-size: 1.75rem;
  line-height: 1;
}

.approval-page__count span {
  font-size: 0.7rem;
}

.approval-page__alert {
  margin-bottom: 1rem;
}

.approval-page__state {
  display: grid;
  min-height: 16rem;
  place-items: center;
  align-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #cbd5e1;
  text-align: center;
  border: 1px dashed rgb(165 180 252 / 0.4);
  border-radius: 0.75rem;
}

.approval-page__state p,
.approval-page__state h2 {
  margin: 0;
}

.approval-page__state h2 {
  color: #f8fafc;
  font-family: Georgia, serif;
  font-size: 1.35rem;
}

.approval-page__state-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #a5b4fc;
}

.approval-page__empty-mark {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: #172554;
  font-size: 1.4rem;
  font-weight: 700;
  background: #a5b4fc;
  border-radius: 50%;
}

.approval-page__list {
  display: grid;
  gap: 0.9rem;
}

.approval-card {
  display: grid;
  gap: 1rem;
  padding: 1.1rem;
  background: rgb(255 255 255 / 0.96);
  border: 1px solid rgb(199 210 254 / 0.5);
  border-radius: 0.75rem;
  box-shadow: 0 12px 30px rgb(2 8 23 / 0.14);
}

.approval-card__identity,
.approval-card__actions {
  display: flex;
  align-items: center;
}

.approval-card__identity {
  gap: 0.8rem;
  min-width: 0;
}

.approval-card__avatar {
  display: grid;
  flex: 0 0 2.75rem;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: #312e81;
  font-family: Georgia, serif;
  font-size: 1.2rem;
  background: #e0e7ff;
  border-radius: 0.65rem;
}

.approval-card__name,
.approval-card__email {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.approval-card__name {
  color: #172554;
  font-size: 1rem;
}

.approval-card__email {
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.85rem;
}

.approval-card__details {
  display: grid;
  gap: 0.25rem;
  color: #334155;
  font-size: 0.85rem;
}

.approval-card__label {
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.approval-card__actions {
  gap: 0.6rem;
}

.approval-card__actions > * {
  flex: 1;
}

@media (min-width: 640px) {
  .approval-card {
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    padding: 1.25rem 1.4rem;
  }

  .approval-card__actions > * {
    flex: initial;
  }
}

@media (max-width: 639px) {
  .approval-page__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .approval-page__count {
    text-align: left;
    border-right: 0;
    border-left: 3px solid #fb7185;
  }
}
</style>
