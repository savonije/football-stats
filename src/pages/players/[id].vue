<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';

    import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
    import EditDialog from '@/pages/players/_components/EditDialog.vue';
    import GoalsTimelineCard from '@/pages/players/_components/GoalsTimelineCard.vue';
    import Hero from '@/pages/players/_components/Hero.vue';
    import InfoCard from '@/pages/players/_components/InfoCard.vue';
    import StatisticsPanel from '@/pages/players/_components/StatisticsPanel.vue';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useTrainingStore } from '@/stores/trainingStore';
    import type { Player } from '@/types';

    const matchStore = useMatchStore();
    const trainingStore = useTrainingStore();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const route = useRoute();

    const playerId = computed(() => route.params.id as string);
    const player = ref<Player | null>(null);
    const loading = ref(true);
    const editVisible = ref(false);

    const fetchSeasonData = (seasonId: string) => {
        matchStore.fetchMatches(seasonId);
        matchStore.fetchAppearances(seasonId);
        trainingStore.fetchTrainings(seasonId);
    };

    onMounted(async () => {
        player.value = await playerStore.fetchPlayer(playerId.value);
        fetchSeasonData(seasonStore.currentSeason);
        loading.value = false;
    });

    watch(() => seasonStore.currentSeason, fetchSeasonData);
</script>

<template>
    <AppBreadcrumb :label="player?.name" />

    <Hero :player="player" :loading="loading" @edit="editVisible = true" />

    <StatisticsPanel :player-id="playerId" :loading="loading" />

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfoCard :player="player" :loading="loading" />

        <GoalsTimelineCard
            class="lg:col-span-2"
            :player-id="playerId"
            :loading="loading"
        />
    </div>

    <EditDialog v-model:visible="editVisible" v-model:player="player" />
</template>
