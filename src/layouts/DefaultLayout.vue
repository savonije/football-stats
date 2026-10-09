<script setup lang="ts">
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';

    import PageFooter from '@/components/layout/PageFooter.vue';
    import PageHeader from '@/components/layout/PageHeader.vue';
    import PageTransition from '@/components/layout/PageTransition.vue';
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
        <PageTransition>
            <div :key="route.path" class="flex grow flex-col">
                <template v-if="heading">
                    <AppBreadcrumb :label="heading" />
                    <div class="mb-3 flex items-center justify-between gap-4">
                        <h1 class="mb-0">{{ heading }}</h1>
                        <div id="page-actions" />
                    </div>
                </template>
                <slot />
            </div>
        </PageTransition>
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
