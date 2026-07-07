<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from 'primevue';

    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useStoreAuth } from '@/stores/authStore';
    import ProgressSpinner from '@/components/ProgressSpinner.vue';
    import TrainingMonthCalendar from '@/components/TrainingMonthCalendar.vue';
    import GenerateTrainingsDialog from '@/components/GenerateTrainingsDialog.vue';
    import TrainingDaysDialog from '@/components/TrainingDaysDialog.vue';

    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const authStore = useStoreAuth();
    const { t } = useI18n();

    const showGenerateDialog = ref(false);
    const showTrainingDaysDialog = ref(false);
    // The month currently shown in the calendar; the generator targets it.
    const viewMonth = ref<Date>(new Date());
    const canEdit = computed(
        () => !!authStore.user?.id && seasonStore.isCurrentSeasonActive,
    );

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
    <TrainingDaysDialog v-model:visible="showTrainingDaysDialog" />
</template>
