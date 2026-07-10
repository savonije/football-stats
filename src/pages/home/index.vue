<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted } from 'vue';
    import MatchList from '@/pages/home/_components/MatchList.vue';
    import MatchResultsChart from '@/pages/home/_components/MatchResultsChart.vue';
    import LiveMatchWidget from '@/pages/home/_components/LiveMatchWidget.vue';
    import { Card } from 'primevue';

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
    <div class="md:w-1/3">
        <LiveMatchWidget />
    </div>

    <Card v-if="recentMatchData.length > 0">
        <template #title>
            <h2 class="mb-2">{{ $t('match.recentResults') }}</h2>
        </template>
        <template #content>
            <MatchResultsChart
                v-if="matchStore.matchesLoaded"
                :data="recentMatchData"
            />
        </template>
    </Card>

    <h1 class="mt-8 mb-3">{{ $t('match.game', 2) }}</h1>
    <MatchList />
</template>
