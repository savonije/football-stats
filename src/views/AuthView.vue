<script setup lang="ts">
    import { reactive, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DefaultLayout from '@/layouts/DefaultLayout.vue';

    import { useStoreAuth } from '@/stores/storeAuth';

    const { t } = useI18n();
    const storeAuth = useStoreAuth();

    const credentials = reactive({
        email: '',
        password: '',
    });

    const errorMessage = ref('');

    const submitForm = () => {
        if (!credentials.email) {
            errorMessage.value = t('errors.emailError');
        } else if (!credentials.password) {
            errorMessage.value = t('errors.passwordError');
        } else {
            errorMessage.value = '';
            storeAuth.loginUser(credentials);
        }
    };
</script>

<template>
    <DefaultLayout>
        <div
            class="mx-auto w-full rounded-sm bg-white p-6 shadow-sm sm:max-w-[500px] dark:bg-gray-950 dark:text-white"
        >
            <h1>{{ t('common.login') }}</h1>

            <form @submit.prevent="submitForm">
                <fieldset class="mb-6">
                    <label class="block font-bold"
                        >{{ t('common.email') }}:</label
                    >
                    <input
                        v-model="credentials.email"
                        class="h-12 w-full rounded-sm border p-3 shadow-sm"
                        type="email"
                    />
                </fieldset>

                <fieldset class="mb-6">
                    <label class="block font-bold"
                        >{{ t('common.password') }}:</label
                    >
                    <input
                        v-model="credentials.password"
                        class="h-12 w-full rounded-sm border p-3 shadow-sm"
                        type="password"
                    />
                </fieldset>

                <div
                    v-if="errorMessage"
                    class="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700"
                >
                    {{ errorMessage }}
                </div>

                <div class="mt-6 text-right">
                    <button class="button" type="submit">
                        {{ t('common.login') }}
                    </button>
                </div>
            </form>
        </div>
    </DefaultLayout>
</template>
