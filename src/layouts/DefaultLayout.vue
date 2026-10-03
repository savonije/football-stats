<script setup lang="ts">
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';

    import PageFooter from '@/components/layout/PageFooter.vue';
    import PageHeader from '@/components/layout/PageHeader.vue';
    import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';

    const route = useRoute();
    const { t } = useI18n();

    const heading = computed(
        () =>
            route.meta.heading &&
            t(route.meta.heading.labelKey, route.meta.heading.count ?? 1),
    );
</script>

<template>
    <PageHeader />
    <main class="page-enter container flex grow flex-col">
        <template v-if="heading">
            <AppBreadcrumb :label="heading" />
            <h1 class="mb-3">{{ heading }}</h1>
        </template>
        <slot />
    </main>
    <PageFooter />
</template>

<style scoped>
    .page-enter {
        animation: page-slide-up 0.35s ease-out both;
    }

    @keyframes page-slide-up {
        from {
            opacity: 0;
            transform: translateY(14px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
