<script setup lang="ts">
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import StatTile from '@/components/ui/StatTile.vue';
    import StatProgressBar from '@/pages/players/_components/StatProgressBar.vue';

    import { usePlayerAppearances } from '@/composables/usePlayerAppearances';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { attendancePercentage } from '@/utils/training';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const { t } = useI18n();
    const trainingStore = useTrainingStore();

    const { endedMatchIds, playerAppearances } = usePlayerAppearances(
        () => playerId,
    );

    const attended = computed(
        () => playerAppearances.value.filter((a) => a.present).length,
    );

    const goals = computed(() =>
        playerAppearances.value.reduce((sum, a) => sum + (a.goals || 0), 0),
    );

    const matchAttendance = computed(() =>
        endedMatchIds.value.size
            ? Math.round((attended.value / endedMatchIds.value.size) * 100)
            : 0,
    );

    const trainingAttendance = computed(() =>
        attendancePercentage(playerId, trainingStore.trainings),
    );

    const tiles = computed(() => [
        { label: t('player.totalGoals'), value: `${goals.value}` },
        {
            label: t('player.totalKeeper'),
            value: `${playerAppearances.value.filter((a) => a.isGoalkeeper).length}`,
        },
        {
            label: t('common.goalsPerMatch'),
            // Averaged over the matches the player actually attended, not over
            // every match of the season.
            value: attended.value
                ? (goals.value / attended.value).toFixed(2)
                : '0.00',
        },
        {
            label: t('player.totalAppearances'),
            value: `${attended.value}`,
            suffix: `/${endedMatchIds.value.size}`,
        },
        {
            label: t('common.attendancePercentage'),
            value: `${matchAttendance.value}`,
            suffix: '%',
            bar: { percentage: matchAttendance.value, color: 'green' } as const,
        },
        {
            label: t('training.attendancePercentage'),
            value: `${trainingAttendance.value}`,
            suffix: '%',
            bar: {
                percentage: trainingAttendance.value,
                color: 'teal',
            } as const,
        },
    ]);
</script>

<template>
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatTile
            v-for="tile in tiles"
            :key="tile.label"
            :label="tile.label"
            :loading="loading"
            :suffix="tile.suffix"
            :value="tile.value"
        >
            <StatProgressBar
                v-if="tile.bar"
                :color="tile.bar.color"
                :percentage="tile.bar.percentage"
            />
        </StatTile>
    </div>
</template>
