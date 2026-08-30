<script setup lang="ts">
    import { reactive, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useStoreAuth } from '@/stores/authStore';
    import { CLUBNAME } from '@/constants';

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
                    Statistieken
                </p>
            </div>

            <hr class="mb-7 border-t border-gray-200" />

            <form
                class="grid"
                data-testid="login-form"
                @submit.prevent="submitForm"
            >
                <UFormField class="mb-7" :label="t('common.email')">
                    <UInput
                        id="username"
                        v-model="credentials.email"
                        class="w-full"
                        autocomplete="email"
                        icon="i-lucide-user"
                        type="email"
                        data-testid="input-email"
                    />
                </UFormField>

                <UFormField class="mb-2" :label="t('auth.password')">
                    <UInput
                        id="password"
                        v-model="credentials.password"
                        class="w-full"
                        autocomplete="current-password"
                        icon="i-lucide-lock"
                        type="password"
                        data-testid="input-password"
                    />
                </UFormField>

                <UAlert
                    v-if="errorMessage"
                    class="mt-2"
                    color="error"
                    :description="errorMessage"
                    icon="i-lucide-triangle-alert"
                    variant="subtle"
                    data-testid="error-message"
                />

                <UButton
                    class="mt-6"
                    block
                    icon="i-lucide-log-in"
                    :label="t('auth.login')"
                    size="lg"
                    type="submit"
                    data-testid="btn-submit"
                />
            </form>
        </div>
    </div>
</template>
