<script setup lang="ts">
    import { computed } from 'vue';

    import Tile from '@/pages/players/_components/Tile.vue';
    import StatProgressBar from '@/pages/players/_components/StatProgressBar.vue';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { attendancePercentage } from '@/utils/training';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const trainingStore = useTrainingStore();

    const trainingAttendancePercentage = computed(() =>
        attendancePercentage(playerId, trainingStore.trainings),
    );
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
