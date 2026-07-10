<script setup lang="ts">
    withDefaults(
        defineProps<{
            icon: string;
            gradient: string;
            label: string;
            value: string;
            valueClass?: string;
        }>(),
        { valueClass: 'text-primary-900' },
    );
</script>

<template>
    <li class="flex items-center gap-2.5">
        <span
            class="flex size-7 shrink-0 items-center justify-center rounded-md text-xs text-white"
            aria-hidden="true"
            :style="{ background: gradient }"
        >
            <i :class="icon" />
        </span>
        <span class="text-primary-500 flex-1 text-sm font-medium">
            {{ label }}
        </span>
        <span class="text-sm font-bold" :class="valueClass">
            {{ value }}
        </span>
    </li>
</template>
