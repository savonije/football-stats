<script setup lang="ts">
    import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
    import { computed } from 'vue';

    import LiveMatchWidget from '@/pages/home/_components/LiveMatchWidget.vue';
    import MatchList from '@/pages/home/_components/MatchList.vue';
    import MatchResultsChart from '@/pages/home/_components/MatchResultsChart.vue';
    import NextMatchCard from '@/pages/home/_components/NextMatchCard.vue';
    import TeamStats from '@/pages/home/_components/TeamStats.vue';

    import { useMatchStore } from '@/stores/matchStore';

    const matchStore = useMatchStore();

    const isMobile = useBreakpoints(breakpointsTailwind).smaller('sm');

    const recentMatchData = computed(() => {
        const count = isMobile.value ? 5 : 10;
        return [...matchStore.matches]
            .filter((match) => match.ended && match.result)
            .sort((a, b) => {
                const aTime = a.date?.toMillis?.() ?? 0;
                const bTime = b.date?.toMillis?.() ?? 0;
                return aTime - bTime;
            })
            .slice(-count)
            .map((match) => ({
                opponent: match.opponent,
                goalsFor: match.result!.goalsFor,
                goalsAgainst: match.result!.goalsAgainst,
            }));
    });
</script>

<template>
    <div class="grid grid-cols-1 gap-5">
        <LiveMatchWidget />

        <div class="flex flex-col gap-5 lg:flex-row">
            <section
                v-if="recentMatchData.length > 0"
                class="shadow-card flex-1 rounded-xl bg-white p-5"
            >
                <h2>{{ $t('match.recentResults') }}</h2>
                <MatchResultsChart
                    v-if="matchStore.matchesLoaded"
                    :data="recentMatchData"
                />
            </section>

            <NextMatchCard class="lg:w-80 lg:shrink-0" />
        </div>

        <section>
            <MatchList />
        </section>

        <TeamStats />
    </div>
</template>
