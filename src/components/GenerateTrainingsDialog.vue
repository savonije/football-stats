<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useToast } from 'primevue/usetoast';
    import { Dialog, DatePicker, Button, Message } from 'primevue';
    import dayjs from 'dayjs';

    import { addTrainings } from '@/services/trainingService';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { trainingDatesInMonth } from '@/utils/training';
    import { TOAST_LIFE } from '@/constants';

    const model = defineModel<boolean>('visible');
    const props = defineProps<{ initialMonth?: Date }>();

    const { t } = useI18n();
    const toast = useToast();
    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const loading = ref(false);

    const month = ref<Date>(new Date());

    const trainingDays = computed(
        () =>
            seasonStore.seasons.find((s) => s.id === seasonStore.currentSeason)
                ?.trainingDays ?? [],
    );

    // Dates in the chosen month that already have a training, as YYYY-MM-DD.
    const existingDates = computed(
        () =>
            new Set(
                trainingStore.trainings
                    .filter((tr) => tr.date)
                    .map((tr) => dayjs(tr.date.toDate()).format('YYYY-MM-DD')),
            ),
    );

    // Configured training dates in the month that don't exist yet.
    const newDates = computed(() =>
        trainingDatesInMonth(month.value, trainingDays.value).filter(
            (date) =>
                !existingDates.value.has(dayjs(date).format('YYYY-MM-DD')),
        ),
    );

    const closeDialog = () => (model.value = false);

    const generate = async () => {
        if (!newDates.value.length) return;

        loading.value = true;
        try {
            const count = await addTrainings(
                seasonStore.currentSeason,
                newDates.value,
            );
            toast.add({
                severity: 'success',
                summary: t('common.messages.success'),
                detail: t('training.messages.trainingsGenerated', count),
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

    // Default to the month in view (or the current month) each time it opens.
    watch(model, (visible) => {
        if (visible) month.value = props.initialMonth ?? new Date();
    });
</script>

<template>
    <Dialog
        v-model:visible="model"
        :header="t('training.generateForMonth')"
        modal
        closable
        dismissableMask
        style="width: 420px"
    >
        <div class="flex flex-col gap-4">
            <Message
                v-if="!trainingDays.length"
                severity="warn"
                :closable="false"
            >
                {{ t('training.noTrainingDaysConfigured') }}
            </Message>

            <template v-else>
                <div>
                    <label>{{ t('training.selectMonth') }}</label>
                    <DatePicker
                        v-model="month"
                        view="month"
                        dateFormat="MM yy"
                        showIcon
                        fluid
                    />
                </div>

                <p class="text-primary-500 text-sm font-medium">
                    <template v-if="newDates.length">
                        {{ t('training.newTrainingsCount', newDates.length) }}
                    </template>
                    <template v-else>
                        {{ t('training.allExist') }}
                    </template>
                </p>
            </template>
        </div>

        <template #footer>
            <div class="flex w-full justify-between">
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    @click="closeDialog"
                />
                <Button
                    :label="$t('training.generate')"
                    icon="pi pi-check"
                    :loading="loading"
                    :disabled="!newDates.length"
                    @click="generate"
                />
            </div>
        </template>
    </Dialog>
</template>
