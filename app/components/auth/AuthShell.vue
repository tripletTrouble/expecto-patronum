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
  <UContainer
    as="main"
    class="!bg-transparent flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
  >
    <UCard
      class="w-full max-w-5xl overflow-hidden"
      :ui="{ root: 'bg-white shadow-none ring-0', body: 'bg-white p-0 sm:p-0' }"
    >
      <div class="grid min-h-[42rem] lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)]">
        <section class="order-2 flex items-center p-6 text-gray-900 sm:p-10 lg:order-1 lg:p-12">
          <div class="w-full">
            <slot />
          </div>
        </section>

        <section class="order-1 min-h-72 bg-primary-950 lg:order-2 lg:min-h-full">
          <UCarousel
            :items="slides"
            :autoplay="{ delay: 5000 }"
            :loop="true"
            :dots="true"
            class="h-full"
            :ui="{
              root: 'h-full',
              viewport: 'h-full',
              container: 'h-full',
              item: 'h-full min-w-0',
              controls: 'absolute inset-x-0 bottom-0 z-10 h-12',
              dots: '!bottom-0 bg-black/20 py-2 backdrop-blur-sm',
            }"
          >
            <template #default="{ item }">
              <div class="relative h-full min-h-72 overflow-hidden lg:min-h-full">
                <img
                  :src="item.image"
                  :alt="item.title"
                  class="absolute inset-0 h-full w-full object-cover"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/20 to-transparent" />
                <div class="absolute inset-x-0 bottom-0 p-6 pb-16 text-white sm:p-8 sm:pb-20">
                  <p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">
                    Expecto Patronum
                  </p>
                  <h2 class="max-w-md text-2xl font-bold tracking-tight sm:text-3xl">
                    {{ item.title }}
                  </h2>
                  <p class="mt-3 max-w-md text-sm leading-6 text-primary-100 sm:text-base">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </template>
          </UCarousel>
        </section>
      </div>
    </UCard>
  </UContainer>
</template>
