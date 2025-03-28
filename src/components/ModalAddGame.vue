<script setup lang="ts">
    import { nanoid } from 'nanoid';
    import { nextTick, onMounted, ref } from 'vue';
    import { toast, type ToastOptions } from 'vue3-toastify';

    import ModalLayout from '@/layouts/ModalLayout.vue';

    import 'vue3-toastify/dist/index.css';

    import { useI18n } from 'vue-i18n';

    import { useStoreGames } from '@/stores/storeGames';

    const { t } = useI18n();
    const storeGames = useStoreGames();

    const uniqueId = nanoid(14);

    const model = defineModel<boolean>();
    const opponentInput = ref<HTMLInputElement | null>(null);
    const seasonInput = ref<HTMLInputElement | null>(null);

    const opponent = ref('');
    const season = ref('');

    const closeModal = () => {
        model.value = false;
    };

    const submitForm = () => {
        const formData = {
            id: uniqueId,
            opponent: opponent.value,
            goals_against: 0,
            goals_for: 0,
            season: season.value,
            date: new Date(),
        };

        storeGames.addGame(formData);

        toast.success(`Wedstrijd gestart!`, {
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
        <h2>Wedstrijd starten</h2>

        <form @submit.prevent="submitForm">
            <div class="mb-6 flex gap-3">
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
            </div>

            <div class="mb-12 flex gap-3">
                <div class="flex-1">
                    <label class="mb-2 block font-bold" for="opponent">
                        Seizoen:
                    </label>
                    <select
                        id="season"
                        ref="seasonInput"
                        v-model="season"
                        class="h-12 w-full rounded border px-6 py-3"
                    >
                        <option selected>Q1 2025</option>
                        <option>Q4 2024</option>
                        <option>Q3 2024</option>
                    </select>
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

                <button class="button" type="submit">Start!</button>
            </div>
        </form>
    </ModalLayout>
</template>
