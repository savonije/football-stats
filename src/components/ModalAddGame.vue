<script setup lang="ts">
    import { nextTick, onMounted, ref } from 'vue';
    import { toast, type ToastOptions } from 'vue3-toastify';

    import ModalLayout from '@/layouts/ModalLayout.vue';

    import 'vue3-toastify/dist/index.css';

    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();

    const model = defineModel<boolean>();
    const opponentInput = ref<HTMLInputElement | null>(null);

    const opponent = ref('');
    const goalsAgainst = ref(1);
    const goalsFor = ref(1);

    const closeModal = () => {
        model.value = false;
    };

    const submitForm = () => {
        toast.success(`Wedstrijd toegevoegd.`, {
            autoClose: 3000,
            theme: 'dark',
            dangerouslyHTMLString: true,
        } as ToastOptions);

        closeModal();
    };

    onMounted(() => {
        nextTick(() => {
            if (opponentInput.value) {
                opponentInput.value.focus();
            }
        });
    });
</script>

<template>
    <ModalLayout :showModal="model" @close="closeModal">
        <h2>Wedstrijd toevoegen</h2>

        <form @submit.prevent="submitForm">
            <div class="mb-12 flex gap-3">
                <div class="flex-1">
                    <label class="mb-2 block font-bold" for="opponent">
                        Tegenstander:
                    </label>
                    <input
                        id="opponent"
                        ref="opponentInput"
                        v-model="opponent"
                        class="h-12 w-full rounded border px-6 py-3"
                        type="text"
                    />
                </div>

                <div>
                    <label class="mb-2 block font-bold" for="goalsFor">
                        Goals voor:
                    </label>
                    <input
                        id="goalsFor"
                        ref="goalsFor"
                        v-model="goalsFor"
                        class="h-12 w-full rounded border px-6 py-3"
                        type="number"
                    />
                </div>

                <div>
                    <label class="mb-2 block font-bold" for="goalsAgainst">
                        Doelpunten tegen:
                    </label>
                    <input
                        id="goalsAgainst"
                        ref="goalsAgainst"
                        v-model="goalsAgainst"
                        class="h-12 w-full rounded border px-6 py-3"
                        type="number"
                    />
                </div>
            </div>

            <div class="flex justify-between">
                <button
                    class="font-bold underline-offset-2 opacity-50 hover:underline"
                    type="button"
                    @click="closeModal"
                >
                    {{ t('common.cancel') }}
                </button>

                <button class="button" type="submit">
                    {{ t('common.save') }}
                </button>
            </div>
        </form>
    </ModalLayout>
</template>
