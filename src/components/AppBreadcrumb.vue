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
    <nav v-if="crumbs.length" class="breadcrumb">
        <template v-for="(crumb, i) in crumbs" :key="i">
            <Router-Link class="breadcrumb-link" :to="crumb.to">
                <i v-if="crumb.icon" :class="crumb.icon" />
                {{ t(crumb.labelKey, crumb.count ?? 1) }}
            </Router-Link>
            <i class="pi pi-chevron-right breadcrumb-sep" />
        </template>
        <span class="breadcrumb-current">
            <Skeleton v-if="label === undefined" height="14px" width="80px" />
            <span v-else>{{ label }}</span>
        </span>
    </nav>
</template>

<style scoped>
    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        margin-bottom: 1rem;
    }

    .breadcrumb-link {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #4067b9;
        text-decoration: none;
        transition: color 0.15s ease;
    }

    .breadcrumb-link:hover {
        color: #27428a;
    }

    .breadcrumb-sep {
        font-size: 0.55rem;
        color: #8da7df;
    }

    .breadcrumb-current {
        color: #8da7df;
        display: flex;
        align-items: center;
    }
</style>
