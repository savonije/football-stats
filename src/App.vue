<script setup lang="ts">
    import { nl } from '@nuxt/ui/locale';
    import { onMounted } from 'vue';
    import { RouterView } from 'vue-router';

    import DefaultLayout from '@/layouts/DefaultLayout.vue';

    import { useStoreAuth } from '@/stores/authStore';

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
