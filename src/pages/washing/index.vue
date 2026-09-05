<script setup lang="ts">
    import { computed, onMounted, watch } from 'vue';

    import { useIsAdmin } from '@/composables/useIsAdmin';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';

    import WashingCounts from '@/pages/washing/_components/WashingCounts.vue';
    import WashingSchedule from '@/pages/washing/_components/WashingSchedule.vue';

    const playerStore = usePlayerStore();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();

    const loading = computed(
        () => !playerStore.playersLoaded || !matchStore.matchesLoaded,
    );

    const isAdmin = useIsAdmin();

    onMounted(() => {
        playerStore.fetchPlayers();
        matchStore.fetchMatches(seasonStore.currentSeason);
    });

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => {
            matchStore.fetchMatches(seasonId);
        },
    );
</script>

<template>
    <WashingSchedule :loading="loading" />

    <WashingCounts v-if="isAdmin" :loading="loading" />
</template>
