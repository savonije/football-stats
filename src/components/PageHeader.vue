<script setup lang="ts">
    import { useI18n } from 'vue-i18n';

    import { useStoreAuth } from '@/stores/storeAuth';

    const storeAuth = useStoreAuth();
    const username = import.meta.env.VITE_USERNAME;
    const { t } = useI18n();
</script>

<template>
    <header class="bg-shark text-teal mb-6 py-6 sm:p-3">
        <div class="container flex items-center justify-between gap-6">
            <RouterLink to="/">
                <span class="font-heading text-2xl font-bold">
                    {{ username }}
                </span>
            </RouterLink>

            <div class="flex justify-end gap-3 lg:hidden">
                Mobiel menu
            </div>

            <div class="hidden justify-end gap-3 lg:flex">
                <button
                    v-if="storeAuth.user?.id"
                    class="button button-transparent hover:text-shark text-white"
                    type="button"
                    :aria-label="t('common.logoutUser')"
                    @click="storeAuth.logoutUser"
                >
                    {{ t('common.logout') }}
                </button>

                <RouterLink v-else class="button hover:text-shark" to="/login">
                    {{ t('common.login') }}
                </RouterLink>
            </div>
        </div>
    </header>
</template>
