<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted } from 'vue';
    import MatchList from '@/pages/home/_components/MatchList.vue';
    import MatchResultsChart from '@/pages/home/_components/MatchResultsChart.vue';
    import LiveMatchWidget from '@/pages/home/_components/LiveMatchWidget.vue';
    import TeamStats from '@/pages/home/_components/TeamStats.vue';

    import { useMatchStore } from '@/stores/matchStore';

    const matchStore = useMatchStore();

    const isMobile = ref(window.innerWidth < 640);
    const onResize = () => {
        isMobile.value = window.innerWidth < 640;
    };
    onMounted(() => window.addEventListener('resize', onResize));
    onUnmounted(() => window.removeEventListener('resize', onResize));

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
    <div class="grid gap-16">
        <template class="md:w-1/3">
            <LiveMatchWidget />
        </template>

        <section
            v-if="recentMatchData.length > 0"
            class="shadow-card rounded-xl bg-white p-5"
        >
            <h2 class="mb-6">{{ $t('match.recentResults') }}</h2>
            <MatchResultsChart
                v-if="matchStore.matchesLoaded"
                :data="recentMatchData"
            />
        </section>

        <section>
            <h1 class="mb-3">{{ $t('match.game', 2) }}</h1>
            <MatchList />
        </section>

        <TeamStats class="mt-16" />
    </div>
</template>
