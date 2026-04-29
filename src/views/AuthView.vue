<script setup lang="ts">
    import {
        Button,
        FloatLabel,
        InputText,
        IconField,
        InputIcon,
        Message,
    } from 'primevue';
    import { reactive, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DefaultLayout from '@/layouts/DefaultLayout.vue';

    import { useStoreAuth } from '@/stores/authStore';

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
            class="flex h-full w-full items-center justify-center p-6 sm:p-12 md:p-24"
        >
            <div
                class="mx-auto grid w-full gap-3 rounded-sm bg-white p-6 shadow-sm sm:max-w-[500px]"
                data-testid="login-container"
            >
                <h1 data-testid="login-title">{{ t('auth.login') }}</h1>

                <form
                    class="grid gap-2"
                    data-testid="login-form"
                    @submit.prevent="submitForm"
                >
                    <FloatLabel class="mb-6" variant="on">
                        <IconField>
                            <InputIcon class="pi pi-user" />
                            <InputText
                                id="username"
                                v-model="credentials.email"
                                type="email"
                                fluid
                                autocomplete="email"
                                data-testid="input-email"
                            />
                        </IconField>

                        <label class="font-bold" for="username">
                            {{ t('common.email') }}
                        </label>
                    </FloatLabel>

                    <FloatLabel class="mb-6" variant="on">
                        <IconField>
                            <InputIcon class="pi pi-lock" />
                            <InputText
                                id="password"
                                v-model="credentials.password"
                                toggle-mask
                                fluid
                                type="password"
                                autocomplete="current-password"
                                data-testid="input-password"
                            />
                        </IconField>

                        <label class="font-bold" for="password">
                            {{ t('auth.password') }}
                        </label>
                    </FloatLabel>

                    <Message
                        v-if="errorMessage"
                        severity="error"
                        icon="pi pi-exclamation-triangle"
                        data-testid="error-message"
                    >
                        {{ errorMessage }}
                    </Message>

                    <div class="mt-6 text-right">
                        <Button
                            type="submit"
                            :label="t('auth.login')"
                            icon="pi pi-lock"
                            data-testid="btn-submit"
                        />
                    </div>
                </form>
            </div>
        </div>
    </DefaultLayout>
</template>

<style>
    @import '@/styles/main.css';

    .p-password-input {
        @apply w-full;
    }
</style>
