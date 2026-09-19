<script setup lang="ts">
    import type { TableColumn, TableRow } from '@nuxt/ui/components/Table.vue';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import GoalDistributionBar from '@/pages/topscorers/_components/GoalDistributionBar.vue';
    import TopscorerPodium from '@/pages/topscorers/_components/TopscorerPodium.vue';

    import router from '@/router';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { isGuestInSeason } from '@/utils/playerSeason';
    import { TABLE_UI, sortableHeader } from '@/utils/table';

    const playerStore = usePlayerStore();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const { t } = useI18n();

    const playerTotalStats = computed(() => {
        if (!playerStore.playersLoaded || !matchStore.appearancesLoaded)
            return [];

        return playerStore
            .playersInSeason(seasonStore.currentSeason)
            .map((player) => {
                const appearances = matchStore.appearances.filter(
                    (a) => a.playerId === player.id,
                );

                const totalGoals = appearances.reduce(
                    (sum, a) => sum + (a.goals || 0),
                    0,
                );

                const goalkeeperCount = appearances.filter(
                    (a) => a.isGoalkeeper,
                ).length;

                return {
                    ...player,
                    matchCount: appearances.length,
                    totalGoals,
                    goalkeeperCount,
                };
            });
    });

    const scorers = computed(() =>
        playerTotalStats.value
            .filter((player) => player.totalGoals > 0)
            .sort((a, b) => b.totalGoals - a.totalGoals),
    );

    type TopscorerRow = (typeof playerTotalStats.value)[number];

    const columns = computed<TableColumn<TopscorerRow>[]>(() => [
        {
            accessorKey: 'name',
            header: sortableHeader<TopscorerRow>(t('common.name')),
            meta: { class: { td: 'font-semibold' } },
        },
        {
            accessorKey: 'totalGoals',
            header: sortableHeader<TopscorerRow>(t('common.goal', 2)),
        },
        {
            accessorKey: 'goalkeeperCount',
            header: sortableHeader<TopscorerRow>(t('player.totalKeeper')),
        },
        {
            accessorKey: 'matchCount',
            header: sortableHeader<TopscorerRow>(t('match.game', 2)),
        },
    ]);

    const sorting = ref([{ id: 'totalGoals', desc: true }]);

    const meta = {
        class: {
            tr: (row: TableRow<TopscorerRow>) =>
                isGuestInSeason(row.original, seasonStore.currentSeason)
                    ? '[&>td]:text-gray-300'
                    : '',
        },
    };

    const onSelect = (_event: Event, row: TableRow<TopscorerRow>) => {
        router.push({
            name: 'playerDetail',
            params: { id: row.original.id },
        });
    };

    onMounted(() => {
        playerStore.fetchPlayers();
        matchStore.fetchAppearances(seasonStore.currentSeason);
    });

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => {
            matchStore.fetchAppearances(seasonId);
        },
    );
</script>

<template>
    <TopscorerPodium :players="scorers.slice(0, 3)" />

    <GoalDistributionBar :players="scorers" />

    <UTable
        v-model:sorting="sorting"
        class="rounded-2xl shadow-lg"
        :columns="columns"
        :data="playerTotalStats"
        :loading="!playerStore.playersLoaded || !matchStore.appearancesLoaded"
        :meta="meta"
        :ui="TABLE_UI"
        @select="onSelect"
    />
</template>
