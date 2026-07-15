<script setup lang="ts">
    import { computed } from 'vue';
    import { useMatchStore } from '@/stores/matchStore';

    const matchStore = useMatchStore();

    const stats = computed(() => {
        const played = matchStore.matches.filter(
            (match) => match.ended && match.result,
        );

        const matchesPlayed = played.length;

        const gamesWon = played.filter(
            (match) => match.result!.goalsFor > match.result!.goalsAgainst,
        ).length;

        const goalsFor = played.reduce(
            (sum, match) => sum + match.result!.goalsFor,
            0,
        );

        const goalsAgainst = played.reduce(
            (sum, match) => sum + match.result!.goalsAgainst,
            0,
        );

        const winPercentage =
            matchesPlayed > 0
                ? Math.round((gamesWon / matchesPlayed) * 100)
                : 0;

        return {
            matchesPlayed,
            gamesWon,
            goalsFor,
            goalsAgainst,
            winPercentage,
        };
    });

    const tiles = computed(() => [
        {
            label: 'match.matchesPlayed',
            value: `${stats.value.matchesPlayed}`,
        },
        {
            label: 'match.gamesWon',
            value: `${stats.value.gamesWon}`,
        },
        {
            label: 'match.goalsFor',
            value: `${stats.value.goalsFor}`,
        },
        {
            label: 'match.goalsAgainst',
            value: `${stats.value.goalsAgainst}`,
        },
        {
            label: 'match.winPercentage',
            value: `${stats.value.winPercentage}%`,
        },
    ]);
</script>

<template>
    <section v-if="matchStore.matchesLoaded && stats.matchesPlayed > 0">
        <h2 class="mb-3">{{ $t('match.teamStats') }}</h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div
                v-for="tile in tiles"
                :key="tile.label"
                class="shadow-card flex flex-col gap-1 rounded-xl bg-white p-5"
            >
                <div class="text-primary-900 text-4xl leading-none font-black">
                    {{ tile.value }}
                </div>
                <div
                    class="tracking-label text-primary-400 mt-1.5 text-xs font-bold uppercase"
                >
                    {{ $t(tile.label) }}
                </div>
            </div>
        </div>
    </section>
</template>
