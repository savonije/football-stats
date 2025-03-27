<script setup lang="ts">
    import { defineAsyncComponent } from 'vue';
    import { useI18n } from 'vue-i18n';

    import Loader from '@/components/Loader.vue';

    import { useStoreAuth } from '@/stores/storeAuth';

    const ModalAddGame = defineAsyncComponent(
        () => import('@/components/ModalAddGame.vue'),
    );

    const { t } = useI18n();
    const storeAuth = useStoreAuth();

    const isModalVisible = defineModel<boolean>();

    const openModal = () => {
        isModalVisible.value = true;
    };
</script>

<template>
    <button
        v-if="storeAuth.user?.id"
        class="button"
        type="button"
        @click="openModal"
    >
        {{ t('titles.addMovie') }}
    </button>

    <Suspense>
        <template #default>
            <ModalAddGame v-if="isModalVisible" v-model="isModalVisible" />
        </template>
        <template #fallback>
            <Loader />
        </template>
    </Suspense>
</template>
