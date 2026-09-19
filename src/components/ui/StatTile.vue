<script setup lang="ts">
    const { loading = false } = defineProps<{
        label: string;
        value: string;
        suffix?: string;
        loading?: boolean;
    }>();
</script>

<template>
    <div class="shadow-card flex flex-col gap-1 rounded-xl bg-white p-5">
        <USkeleton v-if="loading" class="my-1 h-11 w-14" />
        <template v-else>
            <div class="text-primary-900 text-4xl leading-none font-black">
                {{ value
                }}<span
                    v-if="suffix"
                    class="text-primary-300 text-lg font-medium"
                    >{{ suffix }}</span
                >
            </div>
            <slot />
        </template>
        <div
            class="tracking-label text-primary-400 mt-1.5 text-xs font-bold uppercase"
        >
            {{ label }}
        </div>
    </div>
</template>
