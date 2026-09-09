<script setup lang="ts">
    import { nl } from '@nuxt/ui/locale';
    import { RouterView } from 'vue-router';

    import { useStoreAuth } from '@/stores/authStore';
    import { onMounted } from 'vue';

    import DefaultLayout from '@/layouts/DefaultLayout.vue';

    const storeAuth = useStoreAuth();

    onMounted(() => {
        storeAuth.init();
    });
</script>

<template>
    <UApp
        :locale="nl"
        :toaster="{
            position: 'top-right',
            ui: { viewport: 'max-w-[90%]' },
        }"
    >
        <RouterView v-slot="{ Component, route }">
            <DefaultLayout v-if="route.meta.layout !== 'blank'">
                <component :is="Component" />
            </DefaultLayout>
            <component :is="Component" v-else />
        </RouterView>
    </UApp>
</template>
