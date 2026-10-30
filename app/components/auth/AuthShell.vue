<script setup lang="ts">
import classroomImage from '~/assets/images/vitaly-gariev-RDf6Cvns88Q-unsplash.webp'
import primarySchoolImage from '~/assets/images/fiqih-alfarish-gc6MB1U0zgg-unsplash-2.webp'
import examImage from '~/assets/images/fajar-herlambang-studio-TmdrCRVDOnQ-unsplash.webp'

const slides = [
  {
    image: classroomImage,
    title: 'Belajar bersama, tumbuh bersama',
    description: 'Buat pengalaman belajar yang lebih terarah dan menyenangkan.',
  },
  {
    image: primarySchoolImage,
    title: 'Dukung perjalanan belajar siswa',
    description: 'Guru dan siswa terhubung dalam satu ruang belajar digital.',
  },
  {
    image: examImage,
    title: 'Ujian yang lebih sederhana',
    description: 'Kerjakan ujian dengan fokus dan lihat hasilnya dengan cepat.',
  },
]
</script>

<template>
  <div
    class="relative isolate min-h-screen flex items-center justify-center overflow-x-hidden px-3 py-4 sm:px-6 sm:py-8 lg:px-8"
  >
    <UCard
      class="relative box-border h-scr w-full max-w-5xl min-w-0 overflow-hidden shadow-[0_24px_80px_rgba(2,8,23,0.38)]"
      :ui="{
        root: 'h-fit bg-default/75 backdrop-blur-sm border border-default ring-0',
        body: 'h-fit flex-none bg-transparent p-0 sm:p-0',
      }"
    >
      <div class="grid h-auto min-w-0 items-start lg:min-h-[42rem] lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] lg:items-stretch">
        <section class="order-1 flex h-auto min-w-0 items-center px-5 py-6 text-gray-900 sm:px-8 sm:py-8 lg:order-1 lg:px-12 lg:py-12">
          <div class="w-full min-w-0">
            <slot />
          </div>
        </section>

        <section class="order-2 h-64 overflow-hidden bg-primary-950 sm:h-80 lg:order-2 lg:h-auto lg:min-h-[42rem]">
          <UCarousel
            :items="slides"
            :autoplay="{ delay: 5000 }"
            :loop="true"
            :dots="true"
            class="h-64 sm:h-80 lg:h-full"
            :ui="{
              root: 'lg:h-full',
              viewport: 'lg:h-full',
              container: 'lg:h-full',
              item: 'h-64 min-w-0 sm:h-80 lg:h-full',
              controls: 'absolute inset-x-0 bottom-0 z-10 h-12',
              dots: '!bottom-0 bg-black/20 py-2 backdrop-blur-sm',
            }"
          >
            <template #default="{ item }">
              <div class="relative h-full overflow-hidden">
                <img
                  :src="item.image"
                  :alt="item.title"
                  class="absolute inset-0 h-full w-full object-cover"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/20 to-transparent" />
                <div class="absolute inset-x-0 bottom-0 p-5 pb-14 text-white sm:p-8 sm:pb-20">
                  <p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">
                    Expecto Patronum
                  </p>
                  <h2 class="max-w-md text-xl font-bold tracking-tight sm:text-3xl">
                    {{ item.title }}
                  </h2>
                  <p class="mt-2 max-w-md text-sm leading-5 text-primary-100 sm:mt-3 sm:text-base sm:leading-6">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </template>
          </UCarousel>
        </section>
      </div>
    </UCard>
  </div>
</template>
