<script setup lang="ts">
    import type { CalendarDate } from '@internationalized/date';
    import { ref, computed, shallowRef, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';

    import { addTrainings } from '@/services/trainingService';
    import { useAppToast } from '@/composables/useAppToast';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { fromCalendarDate, toCalendarDate } from '@/utils/date';

    const model = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useAppToast();
    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const loading = ref(false);

    const date = shallowRef<CalendarDate | undefined>(
        toCalendarDate(new Date()),
    );

    const existingDates = computed(
        () =>
            new Set(
                trainingStore.trainings
                    .filter((tr) => tr.date)
                    .map((tr) => dayjs(tr.date.toDate()).format('YYYY-MM-DD')),
            ),
    );

    const dateExists = computed(() => {
        const selected = fromCalendarDate(date.value);
        return selected
            ? existingDates.value.has(dayjs(selected).format('YYYY-MM-DD'))
            : false;
    });

    const closeDialog = () => (model.value = false);

    const add = async () => {
        const selected = fromCalendarDate(date.value);

        if (!selected || dateExists.value) return;

        loading.value = true;
        try {
            const count = await addTrainings(seasonStore.currentSeason, [
                selected,
            ]);
            toast.success(t('training.messages.trainingsGenerated', { count }));
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.error(t('training.messages.trainingAddError'));
        } finally {
            loading.value = false;
        }
    };

    watch(model, (visible) => {
        if (visible) date.value = toCalendarDate(new Date());
    });
</script>

<template>
    <UModal
        v-model:open="model"
        :title="t('training.addForDate')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex flex-col gap-4">
                <div>
                    <label for="trainingDate">
                        {{ t('training.selectDate') }}
                    </label>
                    <UInputDate
                        id="trainingDate"
                        v-model="date"
                        class="w-full"
                        icon="i-lucide-calendar"
                        data-testid="date-input"
                    />
                </div>

                <UAlert
                    v-if="dateExists && !loading"
                    color="warning"
                    :description="t('training.dateExists')"
                    variant="subtle"
                />
            </div>
        </template>

        <template #footer>
            <div class="flex w-full justify-between gap-3">
                <UButton
                    color="neutral"
                    :label="$t('common.cancel')"
                    variant="subtle"
                    @click="closeDialog"
                />
                <UButton
                    :disabled="dateExists"
                    icon="i-lucide-check"
                    :label="$t('training.add')"
                    :loading="loading"
                    @click="add"
                />
            </div>
        </template>
    </UModal>
</template>
