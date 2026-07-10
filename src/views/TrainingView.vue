<script setup lang="ts">
    import DefaultLayout from '@/layouts/DefaultLayout.vue';
    import TrainingList from '@/components/TrainingList.vue';
</script>

<template>
    <DefaultLayout>
        <h1 class="mb-3">{{ $t('training.title') }}</h1>
        <TrainingList />
    </DefaultLayout>
</template>
