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

    import { useStoreAuth } from '@/stores/authStore';
    import { CLUBNAME, TEAMNAME } from '@/constants';

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
    <div
        class="from-primary-950 via-primary-900 to-primary-600 flex min-h-screen items-center justify-center bg-gradient-to-br p-6"
    >
        <div
            class="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-2xl"
            data-testid="login-container"
        >
            <div class="mb-6 flex flex-col items-center gap-2">
                <img
                    class="mb-2 h-20 w-auto object-contain drop-shadow-md"
                    src="/images/logo.webp"
                    :alt="`${CLUBNAME} logo`"
                />
                <h1 class="m-0 text-xl leading-tight font-black tracking-tight">
                    {{ CLUBNAME }}
                </h1>
                <p
                    class="m-0 text-xs font-medium tracking-widest text-gray-500 uppercase"
                >
                    {{ TEAMNAME }} &mdash; Statistieken
                </p>
            </div>

            <hr class="mb-7 border-t border-gray-200" />

            <form
                class="grid"
                data-testid="login-form"
                @submit.prevent="submitForm"
            >
                <FloatLabel class="mb-7" variant="on">
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
                    <label for="username">{{ t('common.email') }}</label>
                </FloatLabel>

                <FloatLabel class="mb-2" variant="on">
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
                    <label for="password">{{ t('auth.password') }}</label>
                </FloatLabel>

                <Message
                    v-if="errorMessage"
                    class="mt-2"
                    severity="error"
                    icon="pi pi-exclamation-triangle"
                    data-testid="error-message"
                >
                    {{ errorMessage }}
                </Message>

                <Button
                    class="mt-6 w-full"
                    type="submit"
                    :label="t('auth.login')"
                    icon="pi pi-sign-in"
                    size="large"
                    data-testid="btn-submit"
                />
            </form>
        </div>
    </div>
</template>
