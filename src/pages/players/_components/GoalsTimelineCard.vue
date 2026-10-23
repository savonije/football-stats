<script setup lang="ts">
    import { computed } from 'vue';

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
            .flatMap((a) => {
                const match = matchStore.matches.find(
                    (m) => m.id === a.matchId,
                );
                if (!match) return [];
                return [
                    {
                        goals: a.goals || 0,
                        opponent: match.opponent,
                        dateSeconds: match.date?.seconds ?? 0,
                    },
                ];
            })
            .sort((a, b) => a.dateSeconds - b.dateSeconds),
    );
</script>

<template>
    <UCard
        class="flex flex-col"
        :ui="{ body: 'flex flex-1 flex-col p-0 sm:p-0' }"
    >
        <template #header>
            <h2>{{ $t('player.goalsTimeline') }}</h2>
        </template>

        <USkeleton v-if="loading" class="m-4 h-40 sm:m-6" />
        <GoalsChart v-else :data="goalsChartData" />
    </UCard>
</template>
