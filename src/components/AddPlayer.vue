<script setup lang="ts">
    import { defineAsyncComponent } from 'vue';

    import Loader from '@/components/Loader.vue';

    import { useStoreAuth } from '@/stores/storeAuth';

    const ModalAddPlayer = defineAsyncComponent(
        () => import('@/components/ModalAddPlayer.vue'),
    );

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
        Speler toevoegen
    </button>

    <Suspense>
        <template #default>
            <ModalAddPlayer v-if="isModalVisible" v-model="isModalVisible" />
        </template>
        <template #fallback>
            <Loader />
        </template>
    </Suspense>
</template>
