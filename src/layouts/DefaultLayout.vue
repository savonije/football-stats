<script setup lang="ts">
    import PageFooter from '@/components/PageFooter.vue';
    import PageHeader from '@/components/PageHeader.vue';
</script>

<template>
    <PageHeader />
    <main class="page-enter container flex grow flex-col">
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
