<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import dayjs from 'dayjs';

    import { useStoreAuth } from '@/stores/authStore';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { isGuestInSeason } from '@/utils/playerSeason';
    import { attendanceStatus } from '@/utils/training';
    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';
    import TrainingMonthCalendar from '@/pages/training/_components/TrainingMonthCalendar.vue';
    import TrainingActionsMenu from '@/pages/training/_components/TrainingActionsMenu.vue';
    import TrainingAttendanceTable from '@/pages/training/_components/TrainingAttendanceTable.vue';

    const trainingStore = useTrainingStore();
    const authStore = useStoreAuth();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();

    const VIEW_MONTH_KEY = 'trainingViewMonth';

    // The month currently shown in the calendar; the generator targets it.
    // Persisted so navigating into a training and back restores the month.
    const stored = localStorage.getItem(VIEW_MONTH_KEY);
    const viewMonth = ref<Date>(stored ? dayjs(stored).toDate() : new Date());

    const attendeeIds = computed(() =>
        playerStore
            .playersInSeason(seasonStore.currentSeason)
            .filter((p) => !isGuestInSeason(p, seasonStore.currentSeason))
            .map((p) => p.id),
    );

    const rows = computed(() =>
        trainingStore.trainings.map((training) => ({
            id: training.id,
            date: training.date,
            cancelled: training.cancelled ?? false,
            presentCount: training.presentPlayerIds?.length ?? 0,
            unmarkedCount: attendeeIds.value.filter(
                (id) => attendanceStatus(id, training) === 'unmarked',
            ).length,
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
    <div class="mb-3 flex items-center justify-end">
        <TrainingActionsMenu :month="viewMonth" />
    </div>

    <div
        v-if="!trainingStore.trainingsLoaded"
        class="justify-content-center flex"
    >
        <ProgressSpinner />
    </div>

    <TrainingMonthCalendar v-else v-model:month="viewMonth" :trainings="rows" />

    <template v-if="authStore.user">
        <h2 class="text-primary-900 mt-8 mb-3 text-lg font-bold">
            {{ $t('training.attendanceOverview') }}
        </h2>
        <TrainingAttendanceTable />
    </template>
</template>
