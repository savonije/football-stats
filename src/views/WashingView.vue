<script setup lang="ts">
    import DefaultLayout from '@/layouts/DefaultLayout.vue';
    import WashingList from '@/components/WashingList.vue';
</script>

<template>
    <DefaultLayout>
        <h1 class="mb-3">{{ $t('washing.title') }}</h1>
        <WashingList />
    </DefaultLayout>
</template>
