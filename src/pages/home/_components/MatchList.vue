<script setup lang="ts">
    import type { TableColumn, TableRow } from '@nuxt/ui/components/Table.vue';
    import { getPaginationRowModel } from '@tanstack/vue-table';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useRouter } from 'vue-router';

    import dayjs from 'dayjs';

    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';

    import type { Match } from '@/types';
    import { hasStarted } from '@/utils/match';
    import { TABLE_UI, sortableHeader } from '@/utils/table';

    import { useI18n } from 'vue-i18n';

    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const router = useRouter();

    const { t } = useI18n();

    const table = ref();
    const globalFilter = ref('');
    const sorting = ref([{ id: 'date', desc: true }]);
    const pagination = ref({ pageIndex: 0, pageSize: 10 });

    const filteredCount = computed(
        () =>
            table.value?.tableApi?.getFilteredRowModel().rows.length ??
            matchStore.matches.length,
    );

    const washerName = (match: Match) =>
        match.washing
            ? (playerStore.getPlayerById(match.washing)?.name ??
              t('washing.notAssigned'))
            : t('washing.notAssigned');

    const resultClass = (match: Match) => {
        if (!hasStarted(match) || !match.result) return 'text-gray-500';
        if (match.result.goalsFor > match.result.goalsAgainst)
            return 'text-green-700';
        if (match.result.goalsFor < match.result.goalsAgainst)
            return 'text-red-700';
        return 'text-yellow-700';
    };

    const columns = computed<TableColumn<Match>[]>(() => [
        {
            accessorKey: 'date',
            header: sortableHeader<Match>(t('common.date')),
            enableGlobalFilter: false,
        },
        {
            accessorKey: 'opponent',
            header: sortableHeader<Match>(t('common.opponent')),
            enableGlobalFilter: true,
        },
        {
            id: 'homeOrAway',
            header: t('common.homeOrAway'),
            enableGlobalFilter: false,
            meta: {
                class: {
                    td: 'hidden sm:table-cell',
                    th: 'hidden sm:table-cell',
                },
            },
        },
        {
            id: 'washer',
            header: t('washing.washer'),
            enableGlobalFilter: false,
            meta: {
                class: {
                    td: 'hidden md:table-cell',
                    th: 'hidden md:table-cell',
                },
            },
        },
        {
            id: 'result',
            header: t('common.result'),
            enableGlobalFilter: false,
        },
        {
            id: 'actions',
            enableGlobalFilter: false,
            meta: {
                class: {
                    td: 'hidden text-right sm:table-cell',
                    th: 'hidden sm:table-cell',
                },
            },
        },
    ]);

    onMounted(() => {
        matchStore.fetchMatches(seasonStore.currentSeason);
        playerStore.fetchPlayers();
    });

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => {
            matchStore.fetchMatches(seasonId);
        },
    );

    watch(globalFilter, () => (pagination.value.pageIndex = 0));

    const onSelect = (_event: Event, row: TableRow<Match>) => {
        router.push({ name: 'matchDetail', params: { id: row.original.id } });
    };
</script>

<template>
    <div class="mb-4 flex justify-end">
        <UInput
            v-model="globalFilter"
            class="w-full"
            icon="i-lucide-search"
            :placeholder="t('common.searchOpponent')"
        />
    </div>

    <div class="mb-3 flex justify-end">
        <UBadge v-if="matchStore.matchesLoaded">
            {{ filteredCount }} / {{ matchStore.matches.length }}
            {{ t('match.game', 2) }}
        </UBadge>
    </div>

    <div v-if="!matchStore.matchesLoaded" class="justify-content-center flex">
        <ProgressSpinner />
    </div>

    <template v-else>
        <UTable
            ref="table"
            v-model:global-filter="globalFilter"
            v-model:pagination="pagination"
            v-model:sorting="sorting"
            class="rounded-2xl shadow-lg"
            :columns="columns"
            :data="matchStore.matches"
            :global-filter-options="{ globalFilterFn: 'includesString' }"
            :pagination-options="{
                getPaginationRowModel: getPaginationRowModel(),
            }"
            :ui="TABLE_UI"
            @select="onSelect"
        >
            <template #date-cell="{ row }">
                {{
                    row.original.date
                        ? dayjs(row.original.date.toDate()).format('DD-MM-YYYY')
                        : '-'
                }}
            </template>

            <template #homeOrAway-cell="{ row }">
                {{ row.original.home ? t('common.home') : t('common.away') }}
            </template>

            <template #washer-cell="{ row }">
                {{ washerName(row.original) }}
            </template>

            <template #result-cell="{ row }">
                <span class="font-bold" :class="resultClass(row.original)">
                    {{
                        hasStarted(row.original) && row.original.result
                            ? `${row.original.result.goalsFor}-${row.original.result.goalsAgainst}`
                            : '-'
                    }}
                </span>
            </template>

            <template #actions-cell="{ row }">
                <UButton
                    :aria-label="t('match.viewMatchDetails')"
                    icon="i-lucide-chevron-right"
                    size="sm"
                    :to="{
                        name: 'matchDetail',
                        params: { id: row.original.id },
                    }"
                />
            </template>

            <template #empty>
                <p class="py-4 text-center text-gray-500">
                    {{ t('match.noMatches') }}
                </p>
            </template>
        </UTable>

        <div
            v-if="filteredCount > pagination.pageSize"
            class="mt-4 flex justify-center"
        >
            <UPagination
                :items-per-page="pagination.pageSize"
                :page="pagination.pageIndex + 1"
                :total="filteredCount"
                @update:page="pagination.pageIndex = $event - 1"
            />
        </div>
    </template>
</template>
