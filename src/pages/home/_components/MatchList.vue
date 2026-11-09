<script setup lang="ts">
    import type { TableColumn, TableRow } from '@nuxt/ui/components/Table.vue';
    import { getPaginationRowModel } from '@tanstack/vue-table';
    import dayjs from 'dayjs';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import ImportKnvbDialog from '@/components/dialogs/ImportKnvbDialog.vue';

    import { useCanEdit } from '@/composables/useCanEdit';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useSettingsStore } from '@/stores/settingsStore';
    import type { Match } from '@/types';
    import { hasKickoffTime } from '@/utils/date';
    import { hasStarted } from '@/utils/match';
    import { isPlayed } from '@/utils/match';
    import { TABLE_UI, sortableHeader } from '@/utils/table';

    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const router = useRouter();
    const canEdit = useCanEdit();
    const settingsStore = useSettingsStore();
    const showSyncDialog = ref(false);

    const { t } = useI18n();

    const table = ref();
    const globalFilter = ref('');
    const sorting = ref([{ id: 'date', desc: true }]);
    const pagination = ref({ pageIndex: 0, pageSize: 10 });

    const filteredCount = computed(
        () =>
            table.value?.tableApi?.getFilteredRowModel().rows.length ??
            matchStore.periodMatches.length,
    );

    const washerName = (match: Match) =>
        match.washing
            ? (playerStore.getPlayerById(match.washing)?.name ??
              t('washing.notAssigned'))
            : t('washing.notAssigned');

    const dateParts = (match: Match) => {
        const date = match.date.toDate();
        const day = dayjs(date);
        const kickoff = hasKickoffTime(date);
        return {
            day: day.format('D'),
            month: day.format('MMM').replace('.', ''),
            weekday: day.format('dddd'),
            time: kickoff ? day.format('HH:mm') : null,
            short: day.format(kickoff ? 'dd HH:mm' : 'dddd'),
        };
    };

    const resultClass = (match: Match) => {
        if (!hasStarted(match) || !match.result) return 'text-gray-500';
        if (match.result.goalsFor > match.result.goalsAgainst)
            return 'bg-green-50 text-green-700';
        if (match.result.goalsFor < match.result.goalsAgainst)
            return 'bg-red-50 text-red-700';
        return 'bg-yellow-50 text-yellow-700';
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
            meta: { class: { td: 'font-semibold whitespace-normal' } },
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
        ...(settingsStore.washingEnabled
            ? [
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
              ]
            : []),
        ...(seasonStore.currentPeriods.length
            ? [
                  {
                      id: 'period',
                      accessorFn: (match: Match) =>
                          match.friendly
                              ? null
                              : seasonStore.periodNumberOf(match.date.toDate()),
                      header: t('seasons.period'),
                      enableGlobalFilter: false,
                      meta: {
                          class: {
                              td: 'hidden sm:table-cell',
                              th: 'hidden sm:table-cell',
                          },
                      },
                  },
              ]
            : []),
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

    const goToPage = (page: number) => {
        pagination.value = { ...pagination.value, pageIndex: page - 1 };
    };

    watch([globalFilter, () => seasonStore.currentPeriod], () => goToPage(1));

    const onSelect = (_event: Event, row: TableRow<Match>) => {
        router.push({ name: 'matchDetail', params: { id: row.original.id } });
    };
</script>

<template>
    <div class="mb-3 flex flex-wrap items-center gap-3">
        <h1 class="mr-auto mb-0">{{ t('match.game', 2) }}</h1>

        <UButton
            v-if="canEdit && settingsStore.sportlinkClientId"
            icon="i-lucide-refresh-cw"
            :label="t('knvbImport.syncSchedule')"
            variant="subtle"
            @click="showSyncDialog = true"
        />

        <div class="flex w-full items-center gap-3 md:w-auto">
            <UInput
                v-model="globalFilter"
                class="w-full flex-1 lg:max-w-80"
                icon="i-lucide-search"
                :placeholder="t('common.searchOpponent')"
            />

            <UBadge v-if="matchStore.matchesLoaded" class="h-7 shrink-0">
                {{ filteredCount }} / {{ matchStore.periodMatches.length }}
                {{ t('match.game', 2) }}
            </UBadge>
        </div>
    </div>

    <div
        v-if="!matchStore.matchesLoaded"
        class="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-lg"
    >
        <USkeleton v-for="i in 10" :key="i" class="h-10 w-full" />
    </div>

    <template v-else>
        <UTable
            ref="table"
            v-model:global-filter="globalFilter"
            v-model:pagination="pagination"
            v-model:sorting="sorting"
            class="rounded-2xl shadow-lg"
            :columns="columns"
            :data="matchStore.periodMatches"
            :global-filter-options="{ globalFilterFn: 'includesString' }"
            :pagination-options="{
                getPaginationRowModel: getPaginationRowModel(),
            }"
            :ui="{ ...TABLE_UI, thead: 'max-sm:hidden' }"
            @select="onSelect"
        >
            <template #date-cell="{ row }">
                <div v-if="row.original.date" class="flex items-center gap-3">
                    <div
                        class="bg-primary-50 text-primary-800 flex w-11 shrink-0 flex-col items-center rounded-lg py-1.5 leading-none"
                    >
                        <span class="text-lg font-bold">
                            {{ dateParts(row.original).day }}
                        </span>
                        <span
                            class="text-xxs tracking-label font-semibold uppercase"
                        >
                            {{ dateParts(row.original).month }}
                        </span>
                    </div>
                    <div class="flex flex-col leading-tight max-sm:hidden">
                        <span class="font-semibold capitalize">
                            {{ dateParts(row.original).weekday }}
                        </span>
                        <span
                            v-if="dateParts(row.original).time"
                            class="text-sm text-gray-500 tabular-nums"
                        >
                            {{ dateParts(row.original).time }}
                        </span>
                    </div>
                </div>
                <template v-else>-</template>
            </template>

            <template #opponent-cell="{ row }">
                {{ row.original.opponent }}
                <div
                    v-if="row.original.date"
                    class="mt-1 flex items-center gap-2 text-xs font-normal text-gray-500 sm:hidden"
                >
                    <span>{{ dateParts(row.original).short }}</span>
                    <UBadge color="neutral" size="sm" variant="subtle">
                        {{
                            row.original.home
                                ? t('common.home')
                                : t('common.away')
                        }}
                    </UBadge>
                </div>
            </template>

            <template #homeOrAway-cell="{ row }">
                <UBadge color="neutral" variant="subtle">
                    {{
                        row.original.home ? t('common.home') : t('common.away')
                    }}
                </UBadge>
            </template>

            <template #period-cell="{ row }">
                <UBadge
                    v-if="row.getValue('period')"
                    color="neutral"
                    variant="subtle"
                >
                    {{
                        t('seasons.periodLabel', { n: row.getValue('period') })
                    }}
                </UBadge>
            </template>

            <template #washer-cell="{ row }">
                {{ washerName(row.original) }}
            </template>

            <template #result-cell="{ row }">
                <span
                    class="rounded-md px-2 py-1 font-bold tabular-nums"
                    :class="resultClass(row.original)"
                >
                    {{
                        isPlayed(row.original) && row.original.result
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
                @update:page="goToPage"
            />
        </div>
    </template>

    <ImportKnvbDialog v-model:visible="showSyncDialog" />
</template>
