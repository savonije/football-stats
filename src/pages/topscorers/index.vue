<script setup lang="ts">
    import type { TableColumn, TableRow } from '@nuxt/ui/components/Table.vue';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { usePlayerStore } from '@/stores/playerStore';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { TABLE_UI, sortableHeader } from '@/utils/table';

    import router from '@/router';

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
                    totalGoals,
                    goalkeeperCount,
                };
            });
    });

    type TopscorerRow = (typeof playerTotalStats.value)[number];

    const columns = computed<TableColumn<TopscorerRow>[]>(() => [
        {
            accessorKey: 'name',
            header: sortableHeader<TopscorerRow>(t('common.name')),
        },
        {
            accessorKey: 'totalGoals',
            header: sortableHeader<TopscorerRow>(t('common.goal', 2)),
        },
        {
            accessorKey: 'goalkeeperCount',
            header: sortableHeader<TopscorerRow>(t('player.totalKeeper')),
        },
    ]);

    const sorting = ref([{ id: 'totalGoals', desc: true }]);

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
    <UTable
        v-model:sorting="sorting"
        class="rounded-2xl shadow-lg"
        :columns="columns"
        :data="playerTotalStats"
        :loading="!playerStore.playersLoaded || !matchStore.appearancesLoaded"
        :ui="TABLE_UI"
        @select="onSelect"
    />
</template>
