<script setup lang="ts">
    import { useRoute } from 'vue-router';
    import { useI18n } from 'vue-i18n';

    import PageFooter from '@/components/layout/PageFooter.vue';
    import PageHeader from '@/components/layout/PageHeader.vue';

    const route = useRoute();
    const { t } = useI18n();
</script>

<template>
    <PageHeader />
    <main class="page-enter container flex grow flex-col">
        <h1 v-if="route.meta.heading" class="mb-3">
            {{ t(route.meta.heading.labelKey, route.meta.heading.count ?? 1) }}
        </h1>
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
