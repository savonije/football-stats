<script setup lang="ts">
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import { useI18n } from 'vue-i18n';
    import { Skeleton } from 'primevue';

    defineProps<{
        label?: string;
    }>();

    const route = useRoute();
    const { t } = useI18n();

    const crumbs = computed(() => route.meta.breadcrumb ?? []);
</script>

<template>
    <nav
        v-if="crumbs.length"
        class="mb-4 flex items-center gap-1.5 text-xs font-medium"
    >
        <template v-for="(crumb, i) in crumbs" :key="i">
            <Router-Link
                class="text-primary-500 hover:text-primary-700 flex items-center gap-[5px] no-underline transition-colors duration-150"
                :to="crumb.to"
            >
                <i v-if="crumb.icon" :class="crumb.icon" />
                {{ t(crumb.labelKey, crumb.count ?? 1) }}
            </Router-Link>
            <i class="pi pi-chevron-right text-primary-300 text-xs" />
        </template>
        <span class="text-primary-300 flex items-center">
            <Skeleton v-if="label === undefined" height="14px" width="80px" />
            <span v-else>{{ label }}</span>
        </span>
    </nav>
</template>
