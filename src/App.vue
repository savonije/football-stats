<script setup lang="ts">
    import { nl } from '@nuxt/ui/locale';
    import { RouterView } from 'vue-router';

    import { useStoreAuth } from '@/stores/authStore';
    import { onMounted } from 'vue';

    import DefaultLayout from '@/layouts/DefaultLayout.vue';
    import BlankLayout from '@/layouts/BlankLayout.vue';

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
            <component
                :is="
                    route.meta.layout === 'blank' ? BlankLayout : DefaultLayout
                "
            >
                <component :is="Component" />
            </component>
        </RouterView>
    </UApp>
</template>
