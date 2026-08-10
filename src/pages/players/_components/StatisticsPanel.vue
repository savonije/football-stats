<script setup lang="ts">
    import AppearancesTile from '@/pages/players/_components/AppearancesTile.vue';
    import GoalsPerMatchTile from '@/pages/players/_components/GoalsPerMatchTile.vue';
    import MatchAttendanceTile from '@/pages/players/_components/MatchAttendanceTile.vue';
    import TotalGoalsTile from '@/pages/players/_components/TotalGoalsTile.vue';
    import TotalKeeperTile from '@/pages/players/_components/TotalKeeperTile.vue';
    import TrainingAttendanceTile from '@/pages/players/_components/TrainingAttendanceTile.vue';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();
</script>

<template>
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <TotalGoalsTile :player-id="playerId" :loading="loading" />
        <TotalKeeperTile :player-id="playerId" :loading="loading" />
        <GoalsPerMatchTile :player-id="playerId" :loading="loading" />
        <AppearancesTile :player-id="playerId" :loading="loading" />
        <MatchAttendanceTile :player-id="playerId" :loading="loading" />
        <TrainingAttendanceTile :player-id="playerId" :loading="loading" />
    </div>
</template>
