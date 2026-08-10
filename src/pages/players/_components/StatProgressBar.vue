<script setup lang="ts">
    import { ref, watch } from 'vue';

    const { percentage, color } = defineProps<{
        percentage: number;
        color: 'green' | 'teal';
    }>();

    const BAR_CLASSES: Record<'green' | 'teal', string> = {
        green: 'from-green-500 to-green-700',
        teal: 'from-teal-500 to-teal-700',
    };

    const width = ref(0);

    watch(
        () => percentage,
        (pct) => {
            setTimeout(() => {
                width.value = pct;
            }, 80);
        },
        { immediate: true },
    );
</script>

<template>
    <div class="bg-primary-700/10 mt-2 h-1 overflow-hidden rounded-full">
        <div
            class="h-full rounded-full bg-gradient-to-r transition-[width] duration-900 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]"
            :class="BAR_CLASSES[color]"
            aria-hidden="true"
            :style="{ width: `${width}%` }"
        />
    </div>
</template>
