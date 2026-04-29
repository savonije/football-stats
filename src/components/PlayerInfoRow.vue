<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string
    gradient: string
    label: string
    value: string
    valueClass?: string
  }>(),
  { valueClass: 'text-[#1d2e5d]' },
)
</script>

<template>
  <li class="flex items-center gap-2.5">
    <span
      class="w-7 h-7 rounded-[6px] flex items-center justify-center text-white text-[0.72rem] shrink-0"
      :style="{ background: gradient }"
    >
      <i :class="icon" />
    </span>
    <span class="flex-1 text-[0.85rem] text-[#4067b9] font-medium">{{ label }}</span>
    <span class="font-bold text-sm" :class="valueClass">{{ value }}</span>
  </li>
</template>
