<script setup lang="ts">
    const { skeletonWidth = 'w-14' } = defineProps<{
        label: string;
        loading: boolean;
        skeletonWidth?: string;
    }>();
</script>

<template>
    <div class="shadow-card flex flex-col gap-1 rounded-xl bg-white p-5">
        <USkeleton v-if="loading" class="my-1 h-11" :class="skeletonWidth" />
        <template v-else>
            <slot />
            <slot name="extra" />
        </template>
        <div
            class="tracking-label text-primary-400 mt-1.5 text-xs font-bold uppercase"
        >
            {{ label }}
        </div>
    </div>
</template>
