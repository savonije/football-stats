<script setup lang="ts">
    import { computed } from 'vue';

    import StatTile from '@/components/ui/StatTile.vue';

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
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
                v-for="tile in tiles"
                :key="tile.label"
                :label="$t(tile.label)"
                :value="tile.value"
            />
        </div>
    </section>
</template>
