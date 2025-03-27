<script setup lang="ts">
    import PageFooter from '@/components/PageFooter.vue';
    import PageHeader from '@/components/PageHeader.vue';
</script>

<template>
    <PageHeader />
    <main class="container flex grow flex-col">
        <slot />
    </main>
    <PageFooter />
</template>
