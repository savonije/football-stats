<script setup lang="ts">
    import { computed } from 'vue';
    import { Card, Skeleton } from 'primevue';

    import GoalsChart from '@/pages/players/_components/GoalsChart.vue';
    import { usePlayerAppearances } from '@/composables/usePlayerAppearances';
    import { useMatchStore } from '@/stores/matchStore';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const matchStore = useMatchStore();

    const { playerAppearances } = usePlayerAppearances(() => playerId);

    const goalsChartData = computed(() =>
        playerAppearances.value
            .filter((a) => a.present)
            .map((a) => {
                const match = matchStore.matches.find(
                    (m) => m.id === a.matchId,
                );
                if (!match) return null;
                return {
                    goals: a.goals || 0,
                    opponent: match.opponent,
                    dateSeconds: match.date?.seconds ?? 0,
                };
            })
            .filter(
                (
                    item,
                ): item is {
                    goals: number;
                    opponent: string;
                    dateSeconds: number;
                } => item !== null,
            )
            .sort((a, b) => a.dateSeconds - b.dateSeconds)
            .map(({ goals, opponent }) => ({ goals, opponent })),
    );
</script>

<template>
    <Card>
        <template #title>
            <h2>{{ $t('player.goalsTimeline') }}</h2>
        </template>
        <template #content>
            <Skeleton v-if="loading" height="160px" />
            <GoalsChart v-else :data="goalsChartData" />
        </template>
    </Card>
</template>
