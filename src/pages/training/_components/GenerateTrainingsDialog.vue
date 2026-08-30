<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';

    import { addTrainings } from '@/services/trainingService';
    import { useAppToast } from '@/composables/useAppToast';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { trainingDatesInMonth } from '@/utils/training';

    const model = defineModel<boolean>('visible');
    const { initialMonth } = defineProps<{ initialMonth?: Date }>();

    const { t } = useI18n();
    const toast = useAppToast();
    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const loading = ref(false);

    const month = ref<Date>(new Date());

    const monthOptions = Array.from({ length: 12 }, (_, index) => ({
        label: dayjs().month(index).format('MMMM'),
        value: index,
    }));

    const yearOptions = computed(() => {
        const current = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, index) => {
            const year = current - 1 + index;
            return { label: String(year), value: year };
        });
    });

    const selectedMonth = computed({
        get: () => month.value.getMonth(),
        set: (value) =>
            (month.value = new Date(month.value.getFullYear(), value, 1)),
    });

    const selectedYear = computed({
        get: () => month.value.getFullYear(),
        set: (value) =>
            (month.value = new Date(value, month.value.getMonth(), 1)),
    });

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
            toast.success(t('training.messages.trainingsGenerated', { count }));
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.error(t('training.messages.trainingAddError'));
        } finally {
            loading.value = false;
        }
    };

    // Default to the month in view (or the current month) each time it opens.
    watch(model, (visible) => {
        if (visible) month.value = initialMonth ?? new Date();
    });
</script>

<template>
    <UModal
        v-model:open="model"
        :title="t('training.generateForMonth')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex flex-col gap-4">
                <UAlert
                    v-if="!trainingDays.length"
                    color="warning"
                    :description="t('training.noTrainingDaysConfigured')"
                    variant="subtle"
                />

                <template v-else>
                    <div>
                        <label>{{ t('training.selectMonth') }}</label>
                        <div class="flex gap-2">
                            <USelect
                                v-model="selectedMonth"
                                class="flex-1 capitalize"
                                :items="monthOptions"
                            />
                            <USelect
                                v-model="selectedYear"
                                class="w-28"
                                :items="yearOptions"
                            />
                        </div>
                    </div>

                    <p class="text-primary-500 text-sm font-medium">
                        <template v-if="newDates.length">
                            {{
                                t('training.newTrainingsCount', {
                                    count: newDates.length,
                                })
                            }}
                        </template>
                        <template v-else>
                            {{ t('training.allExist') }}
                        </template>
                    </p>
                </template>
            </div>
        </template>

        <template #footer>
            <div class="flex w-full justify-between">
                <UButton
                    color="neutral"
                    :label="$t('common.cancel')"
                    variant="subtle"
                    @click="closeDialog"
                />
                <UButton
                    :disabled="!newDates.length"
                    icon="i-lucide-check"
                    :label="$t('training.generate')"
                    :loading="loading"
                    @click="generate"
                />
            </div>
        </template>
    </UModal>
</template>
