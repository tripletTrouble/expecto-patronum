<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'Persetujuan guru - Expecto Patronum' })

type TeacherStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type Teacher = { id: string, name: string, email: string, createdAt: string, status: TeacherStatus }
type TeacherResponse = {
  data: Teacher[]
  pagination: { page: number, pageSize: number, total: number, totalPages: number }
  summary: { totalRegistration: number, totalPending: number, totalApproved: number, totalRejected: number }
}

const statusOptions = [
  { label: 'Semua status', value: undefined },
  { label: 'Menunggu', value: 'PENDING' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
]
const stats = [
  { key: 'totalRegistration', label: 'Total pendaftaran', icon: 'i-lucide-users', tone: 'text-cyan-200' },
  { key: 'totalPending', label: 'Menunggu tinjauan', icon: 'i-lucide-hourglass', tone: 'text-amber-200' },
  { key: 'totalApproved', label: 'Total disetujui', icon: 'i-lucide-circle-check', tone: 'text-emerald-200' },
  { key: 'totalRejected', label: 'Total ditolak', icon: 'i-lucide-circle-x', tone: 'text-rose-200' },
] as const

const teachers = ref<Teacher[]>([])
const summary = ref<TeacherResponse['summary']>({ totalRegistration: 0, totalPending: 0, totalApproved: 0, totalRejected: 0 })
const pagination = ref<TeacherResponse['pagination']>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const isLoading = ref(true)
const errorMessage = ref('')
const actionError = ref('')
const activeTeacherId = ref('')
const filters = reactive({ search: '', status: undefined as TeacherStatus | undefined })
type SelectedDateRange = { start: CalendarDate, end: CalendarDate }
const dateRange = shallowRef<SelectedDateRange | undefined>(undefined)
const route = useRoute()
const router = useRouter()
const isSyncingFromRoute = ref(false)
let filterUpdateTimer: ReturnType<typeof setTimeout> | undefined
const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const calendarDateFormatter = new DateFormatter('id-ID', { dateStyle: 'medium' })
const timeZone = getLocalTimeZone()

function getRangeEnd(range: SelectedDateRange | undefined) {
  return (range as { start?: CalendarDate, end?: CalendarDate } | undefined)?.end
}

const dateRangeLabel = computed(() => {
  const range = dateRange.value
  if (!range) return 'Pilih rentang tanggal'
  const start = calendarDateFormatter.format(range.start.toDate(timeZone))
  const end = getRangeEnd(range)
  if (!end) return `${start} – pilih tanggal akhir`
  return `${start} – ${calendarDateFormatter.format(end.toDate(timeZone))}`
})

function toDateQuery(date: CalendarDate | undefined) {
  return date?.toString()
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) return (error.data as { message?: string } | undefined)?.message ?? fallback
  return fallback
}

async function loadTeachers(page = 1) {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = {
      page,
      pageSize: 20,
      ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
      ...(getRangeEnd(dateRange.value)
        ? { registeredFrom: toDateQuery(dateRange.value?.start), registeredTo: toDateQuery(getRangeEnd(dateRange.value)) }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }
    const response = await $fetch<TeacherResponse>('/api/admin/teachers/pending', { query })
    teachers.value = response.data
    pagination.value = response.pagination
    summary.value = response.summary
  }
  catch (error: unknown) {
    const statusCode = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined
    if (statusCode === 401) return await router.replace('/login')
    if (statusCode === 403) return await router.replace('/')
    errorMessage.value = getErrorMessage(error, 'Daftar guru belum dapat dimuat. Silakan coba lagi.')
  }
  finally { isLoading.value = false }
}

function queryString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function calendarDateFromQuery(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  try {
    const [year = 0, month = 0, day = 0] = value.split('-').map(Number)
    const date = new CalendarDate(year, month, day)
    return date.toString() === value ? date : undefined
  }
  catch {
    return undefined
  }
}

function routeQueryForFilters(page = 1) {
  const start = dateRange.value?.start
  const end = getRangeEnd(dateRange.value)
  return {
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(start && end ? { registeredFrom: start.toString(), registeredTo: end.toString() } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  }
}

async function updateRouteQuery(page = 1) {
  await router.replace({
    path: route.path,
    query: {
      ...route.query,
      search: undefined,
      status: undefined,
      registeredFrom: undefined,
      registeredTo: undefined,
      page: undefined,
      ...routeQueryForFilters(page),
    },
  })
}

function updatePage(page: number) {
  updateRouteQuery(page)
}

function scheduleFilterUpdate() {
  if (isSyncingFromRoute.value || (dateRange.value?.start && !getRangeEnd(dateRange.value))) return
  if (filterUpdateTimer) clearTimeout(filterUpdateTimer)
  filterUpdateTimer = setTimeout(() => {
    updateRouteQuery(1)
  }, 350)
}

watch(() => route.fullPath, async () => {
  const search = queryString(route.query.search).trim().slice(0, 255)
  const rawStatus = queryString(route.query.status)
  const status = statusOptions.some(option => option.value === rawStatus) ? rawStatus as TeacherStatus : undefined
  const start = calendarDateFromQuery(queryString(route.query.registeredFrom))
  const end = calendarDateFromQuery(queryString(route.query.registeredTo))
  const pageValue = Number(queryString(route.query.page))
  const page = Number.isInteger(pageValue) && pageValue > 0 && pageValue <= 10_000 ? pageValue : 1

  isSyncingFromRoute.value = true
  filters.search = search
  filters.status = status
  dateRange.value = start && end && start.compare(end) <= 0 ? { start, end } : undefined
  isSyncingFromRoute.value = false

  await loadTeachers(page)
}, { immediate: true })

watch(
  [() => filters.search, () => filters.status, dateRange],
  scheduleFilterUpdate,
)

function clearFilters() {
  if (filterUpdateTimer) clearTimeout(filterUpdateTimer)
  Object.assign(filters, { search: '', status: undefined })
  dateRange.value = undefined
  updateRouteQuery(1)
}
function formatDate(date: string) {
  return dateFormatter.format(new Date(date))
}

function statusLabel(status: TeacherStatus) {
  return status === 'PENDING' ? 'Menunggu' : status === 'APPROVED' ? 'Disetujui' : 'Ditolak'
}

function statusColor(status: TeacherStatus) {
  return status === 'PENDING' ? 'warning' : status === 'APPROVED' ? 'success' : 'error'
}

async function changeTeacherStatus(teacher: Teacher, status: 'approve' | 'reject') {
  if (status === 'reject' && !window.confirm(`Tolak pendaftaran ${teacher.name}?`)) return
  activeTeacherId.value = teacher.id
  actionError.value = ''
  try {
    await $fetch(`/api/admin/teachers/${teacher.id}/${status}`, { method: 'POST' })
    await loadTeachers(pagination.value.page)
  }
  catch (error: unknown) { actionError.value = getErrorMessage(error, 'Perubahan status guru gagal. Silakan coba lagi.') }
  finally { activeTeacherId.value = '' }
}

onBeforeUnmount(() => {
  if (filterUpdateTimer) clearTimeout(filterUpdateTimer)
})
</script>

<template>
  <section class="teacher-page">
    <UAlert
      v-if="actionError"
      class="mb-4"
      color="error"
      variant="soft"
      :description="actionError"
      role="alert"
    />

    <div
      class="teacher-stats"
      aria-live="polite"
    >
      <UCard
        v-for="stat in stats"
        :key="stat.key"
        class="teacher-stat"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="teacher-stat__label">
              {{ stat.label }}
            </p>
            <p class="teacher-stat__value">
              {{ summary[stat.key] }}
            </p>
          </div>
          <UIcon
            :name="stat.icon"
            class="size-5"
            :class="stat.tone"
            aria-hidden="true"
          />
        </div>
      </UCard>
    </div>

    <UCard class="teacher-filters mt-5">
      <form
        class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
        @submit.prevent
      >
        <UFormField label="Cari guru">
          <UInput
            v-model="filters.search"
            icon="i-lucide-search"
            variant="ghost"
            placeholder="Cari nama atau email"
            class="w-full"
            :ui="{ base: 'border border-white/20 bg-transparent text-white placeholder:text-indigo-200/70' }"
          />
        </UFormField>
        <UFormField label="Rentang pendaftaran">
          <UPopover>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-calendar-range"
              class="w-full justify-start border border-white/15 text-left text-white hover:bg-white/10"
            >
              {{ dateRangeLabel }}
            </UButton>
            <template #content>
              <UCalendar
                v-model="dateRange"
                range
                :number-of-months="1"
                locale="id-ID"
                class="p-2"
              />
            </template>
          </UPopover>
        </UFormField>
        <UFormField label="Status">
          <USelect
            v-model="filters.status"
            :items="statusOptions"
            value-key="value"
            placeholder="Semua status"
            variant="ghost"
            class="w-full"
            :ui="{ base: 'border border-white/20 bg-transparent text-white' }"
          />
        </UFormField>
        <div class="flex gap-2 lg:justify-end">
          <UButton
            type="button"
            color="secondary"
            variant="solid"
            icon="i-lucide-refresh-cw"
            class="text-white"
            @click="clearFilters"
          >
            Reset
          </UButton>
        </div>
      </form>
    </UCard>

    <UAlert
      v-if="errorMessage"
      class="mt-5"
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
          @click="loadTeachers(pagination.page)"
        >
          Coba lagi
        </UButton>
      </template>
    </UAlert>

    <UCard
      v-else
      class="teacher-results mt-5"
    >
      <div class="mb-4 flex justify-end">
        <UIcon
          v-if="isLoading"
          name="i-lucide-loader-circle"
          class="size-5 animate-spin text-cyan-200"
          aria-label="Memuat"
        />
      </div>
      <div
        v-if="!isLoading && teachers.length === 0"
        class="teacher-empty"
      >
        Tidak ada guru yang cocok dengan filter ini.
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="teacher-table">
          <thead>
            <tr>
              <th>Nama</th><th>Email</th><th>Terdaftar</th><th>Status</th><th class="text-right">
                Tindakan
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="teacher in teachers"
              :key="teacher.id"
            >
              <td data-label="Nama">
                <span class="font-medium text-white">{{ teacher.name }}</span>
              </td>
              <td
                data-label="Email"
                class="text-indigo-200"
              >
                {{ teacher.email }}
              </td>
              <td
                data-label="Terdaftar"
                class="text-indigo-200"
              >
                <time :datetime="teacher.createdAt">{{ formatDate(teacher.createdAt) }}</time>
              </td>
              <td data-label="Status">
                <UBadge
                  :color="statusColor(teacher.status)"
                  variant="subtle"
                >
                  {{ statusLabel(teacher.status) }}
                </UBadge>
              </td>
              <td data-label="Tindakan">
                <div
                  v-if="teacher.status === 'PENDING'"
                  class="flex justify-end gap-2"
                >
                  <UButton
                    size="sm"
                    color="success"
                    :loading="activeTeacherId === teacher.id"
                    :disabled="Boolean(activeTeacherId)"
                    @click="changeTeacherStatus(teacher, 'approve')"
                  >
                    Setujui
                  </UButton>
                  <UButton
                    size="sm"
                    color="error"
                    variant="soft"
                    :loading="activeTeacherId === teacher.id"
                    :disabled="Boolean(activeTeacherId)"
                    @click="changeTeacherStatus(teacher, 'reject')"
                  >
                    Tolak
                  </UButton>
                </div><span
                  v-else
                  class="block text-right text-sm text-indigo-300"
                >Selesai</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="pagination.totalPages > 1"
        class="mt-5 flex justify-center"
      >
        <UPagination
          v-model:page="pagination.page"
          :total="pagination.total"
          :items-per-page="pagination.pageSize"
          @update:page="updatePage"
        />
      </div>
      <p
        class="mt-4 text-right text-xs text-indigo-200/80"
        aria-live="polite"
      >
        {{ pagination.total }} hasil ditemukan
      </p>
    </UCard>
  </section>
</template>

<style scoped>
.teacher-page { width: 100%; }
.teacher-stats { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: .75rem; }
.teacher-stat, .teacher-filters, .teacher-results { background: rgb(255 255 255 / .08); border-color: rgb(255 255 255 / .16); backdrop-filter: blur(18px); box-shadow: inset 0 1px rgb(255 255 255 / .08); }
.teacher-filters :deep(input), .teacher-filters :deep(button[role="combobox"]) { background: transparent; }
.teacher-stat__label { margin: 0; color: #c7d2fe; font-size: .78rem; }
.teacher-stat__value { margin: .45rem 0 0; color: white; font-size: 1.85rem; font-weight: 700; }
.teacher-empty { display: grid; min-height: 14rem; place-items: center; color: #cbd5e1; text-align: center; }
.teacher-table { width: 100%; border-collapse: collapse; color: #e0e7ff; font-size: .9rem; }
.teacher-table th { padding: .75rem 1rem; color: #a5b4fc; font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-align: left; text-transform: uppercase; border-bottom: 1px solid rgb(255 255 255 / .14); }
.teacher-table td { padding: 1rem; border-bottom: 1px solid rgb(255 255 255 / .08); }
.teacher-table tbody tr:last-child td { border-bottom: 0; }
@media (min-width: 640px) { .teacher-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .teacher-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 639px) {
  .teacher-table thead { display: none; }
  .teacher-table, .teacher-table tbody, .teacher-table tr, .teacher-table td { display: block; }
  .teacher-table tr { padding: .9rem 0; border-bottom: 1px solid rgb(255 255 255 / .12); }
  .teacher-table td { display: flex; justify-content: space-between; gap: 1rem; padding: .35rem 0; border: 0; text-align: right; }
  .teacher-table td::before { color: #a5b4fc; content: attr(data-label); font-size: .72rem; font-weight: 700; letter-spacing: .05em; text-align: left; text-transform: uppercase; }
}
</style>
