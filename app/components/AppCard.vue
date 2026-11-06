<template>
  <UCard
    class="border-white/16 bg-translucent shadow-[inset_0_1px_rgb(255_255_255_/_0.08)] backdrop-blur-[18px]"
    :ui="{
      header: 'border-0',
      body: 'border-0',
      footer: 'border-0',
    }"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
