<script setup lang="ts">
    import { Skeleton } from 'primevue';

    withDefaults(
        defineProps<{
            icon: string;
            gradient: string;
            label: string;
            loading: boolean;
            skeletonWidth?: string;
            colSpan?: boolean;
        }>(),
        {
            skeletonWidth: '56px',
            colSpan: false,
        },
    );
</script>

<template>
    <div
        class="shadow-card hover:shadow-card-hover flex flex-col gap-1 rounded-xl bg-white p-5 transition duration-200 ease-in-out hover:-translate-y-0.5"
        :class="{ 'col-span-2 lg:col-span-1': colSpan }"
    >
        <div
            class="shadow-icon mb-2 flex size-9 items-center justify-center rounded-lg text-base text-white"
            :style="{ background: gradient }"
        >
            <i :class="['pi', icon]" />
        </div>
        <Skeleton v-if="loading" class="my-1" height="44px" :width="skeletonWidth" />
        <template v-else>
            <slot />
            <slot name="extra" />
        </template>
        <div class="tracking-label text-primary-400 mt-1.5 text-xs font-bold uppercase">
            {{ label }}
        </div>
    </div>
</template>
