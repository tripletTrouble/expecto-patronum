<script setup lang="ts">
const route = useRoute()
const appConfig = useAppConfig()

const learningModes = [
  {
    icon: 'i-lucide-sparkles',
    title: 'Belajar dengan arah',
    description: 'Ubah bank soal menjadi sesi latihan yang terasa ringan, jelas, dan siap dimulai.',
    accent: 'cyan',
  },
  {
    icon: 'i-lucide-timer-reset',
    title: 'Tetap fokus saat ujian',
    description: 'Timer dan progres tersusun rapi. Jawabanmu tersimpan saat kamu mengerjakan.',
    accent: 'coral',
  },
  {
    icon: 'i-lucide-chart-no-axes-combined',
    title: 'Lihat perkembanganmu',
    description: 'Hasil otomatis memberi gambaran yang lebih jujur tentang langkah belajarmu berikutnya.',
    accent: 'violet',
  },
]

const flow = [
  { label: 'Pilih', detail: 'Masuk dengan akun atau kode ujian', icon: 'i-lucide-log-in' },
  { label: 'Kerjakan', detail: 'Jawab dengan ritme terbaikmu', icon: 'i-lucide-pen-line' },
  { label: 'Tumbuh', detail: 'Baca hasil dan lanjutkan lagi', icon: 'i-lucide-trending-up' },
]

useHead({
  title: `${appConfig.name} - Belajar lebih siap`,
  meta: [
    {
      name: 'description',
      content: 'Ruang ujian digital yang membantu siswa belajar lebih terarah dan guru membuat evaluasi dengan mudah.',
    },
  ],
})
</script>

<template>
  <main class="relative isolate min-h-dvh overflow-hidden bg-[#0d0b2b] text-white motion-reduce:**:transition-none">
    <div
      class="pointer-events-none absolute -top-88 left-[36%] size-168 rounded-full bg-indigo-500/20 blur-[10px]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-64 top-120 size-128 rounded-full bg-cyan-400/10 blur-[10px]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 opacity-30 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-size-[72px_72px] mask-[linear-gradient(to_bottom,black,transparent_82%)]"
      aria-hidden="true"
    />

    <header class="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
      <NuxtLink
        to="/"
        class="group flex items-center gap-3"
        aria-label="Expecto Patronum, beranda"
      >
        <span
          class="grid size-9 place-items-center rounded-xl rounded-br bg-sky-100 text-xs font-extrabold tracking-wider text-[#161340] transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105 motion-reduce:transition-none"
          aria-hidden="true"
        >EP</span>
        <span class="text-sm font-bold text-white">Expecto Patronum</span>
      </NuxtLink>

      <nav
        class="hidden items-center gap-7 text-sm text-indigo-100/70 md:flex"
        aria-label="Navigasi utama"
      >
        <a
          href="#cara-kerja"
          class="transition-colors hover:text-white"
        >Cara kerja</a>
        <a
          href="#untuk-siapa"
          class="transition-colors hover:text-white"
        >Untuk siapa</a>
        <NuxtLink
          to="/login"
          class="transition-colors hover:text-white"
        >Masuk</NuxtLink>
      </nav>

      <UButton
        to="/register"
        color="neutral"
        variant="outline"
        class="border-white/20 bg-white/5 text-white hover:bg-white/12"
      >
        Mulai belajar
      </UButton>
    </header>

    <div
      v-if="route.query.error === 'forbidden'"
      class="relative z-10 mx-auto mt-2 max-w-7xl px-5 sm:px-8 lg:px-10"
    >
      <UAlert
        color="warning"
        variant="soft"
        title="Halaman tidak tersedia"
        description="Peran akunmu tidak memiliki akses ke halaman tersebut."
        role="alert"
      />
    </div>

    <section class="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:pb-32 lg:pt-28">
      <div class="max-w-2xl">
        <div class="mb-7 flex items-center gap-2.5 text-[.7rem] font-bold uppercase tracking-[.12em] text-cyan-200">
          <span
            class="size-[.45rem] rounded-full bg-cyan-300 shadow-[0_0_1rem_#67e8f9]"
            aria-hidden="true"
          />
          <span>Ruang ujian untuk masa depanmu</span>
        </div>

        <h1 class="max-w-175 text-[clamp(3.2rem,7vw,6.6rem)] font-semibold leading-[.98] tracking-[-.065em]">
          Sedikit lebih siap.
          <span class="text-cyan-300">Jauh lebih percaya diri.</span>
        </h1>

        <p class="mt-7 max-w-xl text-lg leading-8 text-indigo-100/70 sm:text-xl">
          Expecto Patronum membuat latihan dan ujian terasa lebih tertata—untuk siswa yang ingin berkembang, dan guru yang ingin mengajar dengan dampak nyata.
        </p>

        <div class="mt-9 flex flex-col gap-3 sm:flex-row">
          <UButton
            to="/register"
            size="xl"
            color="primary"
            trailing-icon="i-lucide-arrow-up-right"
            class="shadow-[0_0_2.5rem_rgb(34_211_238/0.2)]"
          >
            Buat akun gratis
          </UButton>
          <UButton
            to="/login"
            size="xl"
            color="neutral"
            variant="ghost"
            leading-icon="i-lucide-log-in"
            class="text-white hover:bg-white/10"
          >
            Saya sudah punya akun
          </UButton>
        </div>

        <div class="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-indigo-100/55">
          <span class="flex items-center gap-2"><UIcon
            name="i-lucide-shield-check"
            class="size-4 text-cyan-300"
          /> Aman dan tersimpan</span>
          <span class="flex items-center gap-2"><UIcon
            name="i-lucide-smartphone"
            class="size-4 text-cyan-300"
          /> Nyaman di ponsel</span>
        </div>
      </div>

      <div
        class="relative mx-auto grid min-h-100 w-full max-w-lg place-items-center sm:min-h-124"
        aria-label="Pratinjau ruang ujian"
      >
        <div
          class="absolute h-[65%] w-[125%] rotate-[-24deg] rounded-full border border-cyan-300/12"
          aria-hidden="true"
        />
        <div
          class="absolute h-[46%] w-[94%] rotate-35 rounded-full border border-rose-400/16"
          aria-hidden="true"
        />
        <div
          class="absolute right-[13%] top-[9%] size-[.35rem] rounded-full bg-cyan-200 shadow-[0_0_1rem_#67e8f9]"
          aria-hidden="true"
        />
        <div
          class="absolute bottom-[15%] left-[9%] size-[.35rem] rounded-full bg-rose-300 shadow-[0_0_1rem_#fb7185]"
          aria-hidden="true"
        />

        <div class="relative z-10 w-[min(100%,29rem)] overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(145deg,rgb(47_42_107/0.9),rgb(21_19_65/0.94))] shadow-[1rem_2rem_5rem_rgb(0_0_0/0.3),0_0_5rem_rgb(99_102_241/0.18)] rotate-1 sm:rotate-2">
          <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div class="flex items-center gap-3">
              <span class="grid size-9 place-items-center rounded-xl bg-cyan-300/15 text-cyan-200"><UIcon
                name="i-lucide-atom"
                class="size-5"
              /></span>
              <div>
                <p class="text-sm font-semibold text-white">
                  Latihan Matematika
                </p>
                <p class="text-xs text-indigo-100/45">
                  Persiapan ujian · 12 soal
                </p>
              </div>
            </div>
            <UBadge
              color="success"
              variant="soft"
            >
              Sedang berjalan
            </UBadge>
          </div>

          <div class="px-5 py-6 sm:px-7 sm:py-8">
            <div class="mb-7 flex items-end justify-between">
              <div>
                <p class="text-xs font-medium text-cyan-200/70">
                  SOAL 07 <span class="text-indigo-100/35">/ 12</span>
                </p>
                <p class="mt-3 max-w-xs text-lg font-semibold leading-7 text-white">
                  Jika pola ini berlanjut, angka berikutnya adalah...
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-coral-300">
                  18:42
                </p>
                <p class="text-[11px] text-indigo-100/40">
                  tersisa
                </p>
              </div>
            </div>

            <div class="space-y-2.5">
              <div class="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-indigo-100/70 transition-colors hover:border-white/20 hover:bg-white/5">
                <span class="grid size-6 place-items-center rounded-md bg-white/8 text-[.7rem] font-bold">A</span><span>24</span>
              </div>
              <div class="flex items-center gap-3 rounded-xl border border-cyan-300/50 bg-cyan-300/8 px-3 py-2.5 text-sm text-white transition-colors">
                <span class="grid size-6 place-items-center rounded-md bg-white/8 text-[.7rem] font-bold">B</span><span>32</span><UIcon
                  name="i-lucide-check"
                  class="ml-auto size-4 text-cyan-200"
                />
              </div>
              <div class="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-indigo-100/70 transition-colors hover:border-white/20 hover:bg-white/5">
                <span class="grid size-6 place-items-center rounded-md bg-white/8 text-[.7rem] font-bold">C</span><span>36</span>
              </div>
            </div>

            <div class="mt-7 flex items-center justify-between border-t border-white/8 pt-5">
              <span class="text-xs text-indigo-100/40">Progres tersimpan otomatis</span>
              <span class="flex items-center gap-1.5 text-xs font-medium text-cyan-200"><span class="size-1.5 rounded-full bg-cyan-300" /> Online</span>
            </div>
          </div>
        </div>

        <div class="absolute left-[-2%] top-[10%] z-20 flex items-center gap-2.5 rounded-[.9rem] border border-white/15 bg-indigo-950/85 px-3 py-2.5 text-xs shadow-[0_.8rem_2rem_rgb(0_0_0/0.2)] backdrop-blur-xl sm:left-[-3%]">
          <UIcon
            name="i-lucide-medal"
            class="size-4 text-amber-300"
          />
          <div>
            <p class="text-[11px] text-indigo-100/45">
              Skor terakhir
            </p><p class="font-semibold text-white">
              92 / 100
            </p>
          </div>
        </div>
        <div class="absolute bottom-[13%] right-[-2%] z-20 flex items-center gap-2.5 rounded-[.9rem] border border-white/15 bg-indigo-950/85 px-3 py-2.5 text-xs text-cyan-100 shadow-[0_.8rem_2rem_rgb(0_0_0/0.2)] backdrop-blur-xl">
          <UIcon
            name="i-lucide-cloud-check"
            class="size-4 text-cyan-300"
          /> Tersimpan
        </div>
      </div>
    </section>

    <section
      id="untuk-siapa"
      class="relative z-10 mx-auto max-w-7xl border-t border-white/10 px-5 py-20 sm:px-8 lg:px-10"
    >
      <div class="mb-12 max-w-xl">
        <p class="flex items-center gap-2.5 text-[.7rem] font-bold uppercase tracking-[.12em] text-cyan-200">
          Dibuat untuk perjalananmu
        </p>
        <h2 class="mt-4 max-w-155 text-[clamp(2.2rem,4vw,3.8rem)] font-semibold leading-[1.05] tracking-[-.055em]">
          Satu ruang. <span class="text-cyan-300">Tiga cara bertumbuh.</span>
        </h2>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <UCard
          v-for="mode in learningModes"
          :key="mode.title"
          class="min-h-56 border-white/10 bg-white/4.5 transition-transform duration-300 hover:-translate-y-1 hover:bg-white/7.5 motion-reduce:transition-none"
        >
          <div
            class="grid size-10.5 place-items-center rounded-[.85rem] bg-cyan-300/12 text-cyan-200"
            :class="{ 'bg-rose-400/12 text-rose-300': mode.accent === 'coral', 'bg-violet-400/12 text-violet-300': mode.accent === 'violet' }"
          >
            <UIcon
              :name="mode.icon"
              class="size-5"
            />
          </div>
          <h3 class="mt-6 text-xl font-semibold text-white">
            {{ mode.title }}
          </h3>
          <p class="mt-3 text-sm leading-6 text-indigo-100/60">
            {{ mode.description }}
          </p>
        </UCard>
      </div>
    </section>

    <section
      id="cara-kerja"
      class="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:pb-32"
    >
      <div>
        <p class="flex items-center gap-2.5 text-[.7rem] font-bold uppercase tracking-[.12em] text-cyan-200">
          Dari mulai sampai selesai
        </p>
        <h2 class="mt-4 max-w-155 text-[clamp(2.2rem,4vw,3.8rem)] font-semibold leading-[1.05] tracking-[-.055em]">
          Tidak perlu <span class="text-cyan-300">menebak</span> langkah berikutnya.
        </h2>
        <p class="mt-5 max-w-md leading-7 text-indigo-100/60">
          Semua yang kamu butuhkan untuk mengerjakan ujian dengan tenang ada di satu tempat.
        </p>
      </div>

      <div class="border-t border-white/12">
        <div
          v-for="(step, index) in flow"
          :key="step.label"
          class="grid grid-cols-[2.5rem_3rem_1fr] items-center gap-4 border-b border-white/12 py-5"
        >
          <div class="text-xs font-bold text-cyan-300/65">
            0{{ index + 1 }}
          </div>
          <div class="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/8 text-cyan-200">
            <UIcon
              :name="step.icon"
              class="size-5"
            />
          </div>
          <div>
            <h3 class="text-base font-semibold text-white">
              {{ step.label }}
            </h3><p class="mt-1 text-sm text-indigo-100/55">
              {{ step.detail }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative z-10 mx-5 mb-8 overflow-hidden rounded-4xl border border-cyan-200/15 bg-cyan-300/8 px-6 py-14 text-center sm:mx-8 sm:px-12 lg:mx-auto lg:max-w-7xl">
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.14),transparent_55%)]"
        aria-hidden="true"
      />
      <div class="relative">
        <p class="flex items-center gap-2.5 text-[.7rem] font-bold uppercase tracking-[.12em] text-cyan-200">
          Langkah pertama menunggumu
        </p>
        <h2 class="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Ujian yang lebih baik dimulai dari persiapan yang lebih tenang.
        </h2>
        <UButton
          to="/register"
          size="xl"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          class="mt-8 shadow-[0_0_2.5rem_rgb(34_211_238/0.2)]"
        >
          Mulai sekarang
        </UButton>
      </div>
    </section>

    <footer class="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-indigo-100/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
      <div class="flex items-center gap-2">
        <span class="grid size-6 place-items-center rounded-md bg-white/10 text-[9px] font-bold text-cyan-200">EP</span> Expecto Patronum
      </div>
      <p>Belajar dengan ritme yang kamu percaya.</p>
    </footer>
  </main>
</template>
