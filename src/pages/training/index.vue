<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';
    import { Button } from 'primevue';

    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useCanEdit } from '@/composables/useCanEdit';
    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';
    import TrainingMonthCalendar from '@/pages/training/_components/TrainingMonthCalendar.vue';
    import GenerateTrainingsDialog from '@/pages/training/_components/GenerateTrainingsDialog.vue';
    import AddTrainingDialog from '@/pages/training/_components/AddTrainingDialog.vue';
    import TrainingDaysDialog from '@/pages/training/_components/TrainingDaysDialog.vue';

    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const { t } = useI18n();

    const VIEW_MONTH_KEY = 'trainingViewMonth';

    const showGenerateDialog = ref(false);
    const showAddDialog = ref(false);
    const showTrainingDaysDialog = ref(false);
    // The month currently shown in the calendar; the generator targets it.
    // Persisted so navigating into a training and back restores the month.
    const stored = localStorage.getItem(VIEW_MONTH_KEY);
    const viewMonth = ref<Date>(stored ? dayjs(stored).toDate() : new Date());
    const canEdit = useCanEdit();

    const rows = computed(() =>
        trainingStore.trainings.map((training) => ({
            id: training.id,
            date: training.date,
            cancelled: training.cancelled ?? false,
            presentCount: training.presentPlayerIds?.length ?? 0,
        })),
    );

    const fetchForSeason = (seasonId: string) => {
        trainingStore.fetchTrainings(seasonId);
    };

    onMounted(() => {
        fetchForSeason(seasonStore.currentSeason);
        playerStore.fetchPlayers();
    });

    watch(viewMonth, (month) =>
        localStorage.setItem(VIEW_MONTH_KEY, dayjs(month).format('YYYY-MM')),
    );

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => fetchForSeason(seasonId),
    );
</script>

<template>
    <div class="mb-3 flex items-center justify-end gap-3">
        <div v-if="canEdit" class="flex items-center gap-2">
            <Button
                icon="pi pi-cog"
                size="small"
                severity="secondary"
                text
                rounded
                :aria-label="t('training.trainingDays')"
                @click="showTrainingDaysDialog = true"
            />
            <Button
                :label="t('training.generate')"
                icon="pi pi-calendar-plus"
                size="small"
                @click="showGenerateDialog = true"
            />
            <Button
                :label="t('training.add')"
                icon="pi pi-plus"
                size="small"
                @click="showAddDialog = true"
            />
        </div>
    </div>

    <div
        v-if="!trainingStore.trainingsLoaded"
        class="justify-content-center flex"
    >
        <ProgressSpinner />
    </div>

    <TrainingMonthCalendar v-else v-model:month="viewMonth" :trainings="rows" />

    <GenerateTrainingsDialog
        v-model:visible="showGenerateDialog"
        :initial-month="viewMonth"
    />
    <AddTrainingDialog v-model:visible="showAddDialog" />
    <TrainingDaysDialog v-model:visible="showTrainingDaysDialog" />
</template>
