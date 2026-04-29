<script setup lang="ts">
    withDefaults(
        defineProps<{
            icon: string;
            gradient: string;
            label: string;
            value: string;
            valueClass?: string;
        }>(),
        { valueClass: 'text-[#1d2e5d]' },
    );
</script>

<template>
    <li class="flex items-center gap-2.5">
        <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[0.72rem] text-white"
            :style="{ background: gradient }"
        >
            <i :class="icon" />
        </span>
        <span class="flex-1 text-[0.85rem] font-medium text-[#4067b9]">{{
            label
        }}</span>
        <span class="text-sm font-bold" :class="valueClass">{{ value }}</span>
    </li>
</template>
