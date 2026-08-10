<script setup lang="ts">
    import { Skeleton } from 'primevue';

    withDefaults(
        defineProps<{
            label: string;
            loading: boolean;
            skeletonWidth?: string;
        }>(),
        { skeletonWidth: '56px' },
    );
</script>

<template>
    <div class="shadow-card flex flex-col gap-1 rounded-xl bg-white p-5">
        <Skeleton
            v-if="loading"
            class="my-1"
            height="44px"
            :width="skeletonWidth"
        />
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
