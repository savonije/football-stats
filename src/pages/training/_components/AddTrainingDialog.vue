<script setup lang="ts">
    import type { CalendarDate } from '@internationalized/date';
    import { ref, computed, shallowRef, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';

    import { addTrainings } from '@/services/trainingService';
    import { useAppToast } from '@/composables/useAppToast';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import DatePicker from '@/components/ui/DatePicker.vue';
    import { fromCalendarDate, toCalendarDate } from '@/utils/date';
    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

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
                    <DatePicker id="trainingDate" v-model="date" />
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
            <DialogFooter
                :confirm-label="$t('training.add')"
                confirm-icon="i-lucide-check"
                :disabled="dateExists"
                :loading="loading"
                @cancel="closeDialog"
                @confirm="add"
            />
        </template>
    </UModal>
</template>
