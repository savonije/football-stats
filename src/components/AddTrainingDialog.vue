<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useToast } from 'primevue/usetoast';
    import { Dialog, DatePicker, MultiSelect, Button } from 'primevue';

    import { addTraining } from '@/services/trainingService';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { isGuestInSeason } from '@/utils/playerSeason';
    import { nextTrainingDate } from '@/utils/training';
    import { TOAST_LIFE } from '@/constants';

    const model = defineModel<boolean>('visible');
    const props = defineProps<{ initialDate?: Date | null }>();

    const { t } = useI18n();
    const toast = useToast();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const loading = ref(false);

    const form = reactive<{ date: Date | null; players: string[] }>({
        date: null,
        players: [],
    });

    const currentTrainingDays = computed(
        () =>
            seasonStore.seasons.find((s) => s.id === seasonStore.currentSeason)
                ?.trainingDays ?? [],
    );

    // Trainings are for the regular squad only — guest players are excluded.
    const seasonPlayers = computed(() =>
        playerStore
            .playersInSeason(seasonStore.currentSeason)
            .filter(
                (player) =>
                    !isGuestInSeason(player, seasonStore.currentSeason),
            ),
    );

    const playerOptions = computed(() =>
        seasonPlayers.value.map((player) => ({
            label: player.name,
            value: player.id,
        })),
    );

    const closeDialog = () => (model.value = false);

    const submitTraining = async () => {
        if (!form.date) {
            toast.add({
                severity: 'warn',
                summary: t('common.validation.warning'),
                detail: t('common.validation.fillAll'),
                life: TOAST_LIFE,
            });
            return;
        }

        loading.value = true;
        try {
            await addTraining(seasonStore.currentSeason, {
                date: form.date,
                playerIds: form.players,
            });

            toast.add({
                severity: 'success',
                summary: t('common.messages.success'),
                detail: t('training.messages.trainingAdded'),
                life: TOAST_LIFE,
            });
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                detail: t('training.messages.trainingAddError'),
                life: TOAST_LIFE,
            });
        } finally {
            loading.value = false;
        }
    };

    onMounted(async () => {
        await playerStore.fetchPlayers();
    });

    // Pre-select the whole (guest-free) squad whenever the roster changes.
    watch(
        seasonPlayers,
        (players) => {
            form.players = players.map((player) => player.id);
        },
        { immediate: true },
    );

    // Reset the date each time the dialog opens: the prefilled day from the
    // calendar if provided, otherwise the next configured training day.
    watch(
        model,
        (visible) => {
            if (visible) {
                form.date =
                    props.initialDate ??
                    nextTrainingDate(currentTrainingDays.value);
            }
        },
        { immediate: true },
    );
</script>

<template>
    <Dialog
        v-model:visible="model"
        :header="t('training.addTraining')"
        modal
        closable
        dismissableMask
        style="width: 450px"
    >
        <div class="flex flex-col gap-3">
            <div>
                <label>{{ t('common.date') }}</label>
                <DatePicker
                    v-model="form.date"
                    dateFormat="dd-mm-yy"
                    showIcon
                    fluid
                />
            </div>

            <div>
                <label>{{ t('player.player', 2) }}</label>
                <MultiSelect
                    v-model="form.players"
                    :options="playerOptions"
                    optionLabel="label"
                    optionValue="value"
                    multiple
                    showClear
                    fluid
                />
            </div>
        </div>

        <template #footer>
            <div class="flex w-full justify-between">
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    @click="closeDialog"
                />
                <Button
                    :label="$t('common.add')"
                    icon="pi pi-check"
                    :loading="loading"
                    @click="submitTraining"
                />
            </div>
        </template>
    </Dialog>
</template>
