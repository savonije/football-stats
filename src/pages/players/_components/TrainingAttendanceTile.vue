<script setup lang="ts">
    import { computed } from 'vue';

    import Tile from '@/pages/players/_components/Tile.vue';
    import StatProgressBar from '@/pages/players/_components/StatProgressBar.vue';
    import { useTrainingStore } from '@/stores/trainingStore';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const trainingStore = useTrainingStore();

    // Only trainings that were actually held count: cancelled ones and any
    // still in the future are left out of the total.
    const activeTrainings = computed(() => {
        const now = Date.now() / 1000;
        return trainingStore.trainings.filter(
            (training) =>
                !training.cancelled && (training.date?.seconds ?? 0) <= now,
        );
    });

    const trainingAttendancePercentage = computed(() => {
        const totalTrainings = activeTrainings.value.length;
        if (totalTrainings === 0) return 0;

        const attended = activeTrainings.value.filter((training) =>
            (training.presentPlayerIds ?? []).includes(playerId),
        ).length;
        return Math.round((attended / totalTrainings) * 100);
    });
</script>

<template>
    <Tile :label="$t('training.attendancePercentage')" :loading="loading">
        <div class="text-primary-900 text-4xl leading-none font-black">
            {{ trainingAttendancePercentage }}
            <span class="text-primary-300 text-lg font-medium">%</span>
        </div>
        <template #extra>
            <StatProgressBar
                :percentage="trainingAttendancePercentage"
                color="teal"
            />
        </template>
    </Tile>
</template>
