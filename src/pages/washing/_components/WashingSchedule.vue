<script setup lang="ts">
    import type { TableColumn } from '@nuxt/ui/components/Table.vue';
    import { getPaginationRowModel } from '@tanstack/vue-table';
    import dayjs from 'dayjs';
    import { computed, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useIsAdmin } from '@/composables/useIsAdmin';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Match } from '@/types';
    import { isGuestInSeason } from '@/utils/playerSeason';
    import { TABLE_UI, sortableHeader } from '@/utils/table';

    const { loading } = defineProps<{ loading: boolean }>();

    const playerStore = usePlayerStore();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const toast = useAppToast();
    const { t } = useI18n();

    type SchedulePeriod = 'upcoming' | 'past' | 'all';
    type AssignmentFilter = 'all' | 'unassigned' | 'assigned';

    const isAdmin = useIsAdmin();

    const washingOptions = computed(() => [
        { label: t('washing.notAssigned'), value: null },
        ...playerStore
            .playersInSeason(seasonStore.currentSeason)
            .filter(
                (player) => !isGuestInSeason(player, seasonStore.currentSeason),
            )
            .map((player) => ({
                label: player.name,
                value: player.id as string | null,
            })),
    ]);

    const schedulePeriod = ref<SchedulePeriod>('upcoming');
    const assignment = ref<AssignmentFilter>('all');

    const periodOptions = computed(() =>
        (['upcoming', 'past', 'all'] as const).map((value) => ({
            label: t(`washing.period.${value}`),
            value,
        })),
    );

    const assignmentOptions = computed(() =>
        (['all', 'unassigned', 'assigned'] as const).map((value) => ({
            label: t(`washing.assignment.${value}`),
            value,
        })),
    );

    const isUpcoming = (match: Match) =>
        !match.date || !dayjs(match.date.toDate()).isBefore(dayjs(), 'day');

    const scheduleRows = computed(() =>
        matchStore.matches
            .filter((match) =>
                assignment.value === 'all'
                    ? true
                    : !!match.washing === (assignment.value === 'assigned'),
            )
            .filter((match) =>
                schedulePeriod.value === 'all'
                    ? true
                    : isUpcoming(match) ===
                      (schedulePeriod.value === 'upcoming'),
            )
            .sort((a, b) => {
                const diff = (a.date?.seconds ?? 0) - (b.date?.seconds ?? 0);
                return schedulePeriod.value === 'upcoming' ? diff : -diff;
            })
            .map((match) => ({
                id: match.id,
                opponent: match.opponent,
                date: match.date,
                washing: match.washing ?? null,
                washerName: match.washing
                    ? (playerStore.getPlayerById(match.washing)?.name ?? '?')
                    : '',
            })),
    );

    type ScheduleRow = (typeof scheduleRows.value)[number];

    const scheduleColumns = computed<TableColumn<ScheduleRow>[]>(() => [
        {
            accessorKey: 'date',
            header: sortableHeader<ScheduleRow>(t('common.date')),
        },
        {
            accessorKey: 'opponent',
            header: sortableHeader<ScheduleRow>(t('common.opponent')),
        },
        { id: 'responsible', header: t('washing.responsible') },
    ]);

    const schedulePagination = ref({ pageIndex: 0, pageSize: 10 });

    const emptyMessage = computed(() => {
        if (assignment.value === 'unassigned') return t('washing.allAssigned');
        if (schedulePeriod.value === 'all' && assignment.value === 'all')
            return t('match.noMatches');
        return t('washing.noMatchesInPeriod');
    });

    const goToSchedulePage = (page: number) => {
        schedulePagination.value = {
            ...schedulePagination.value,
            pageIndex: page - 1,
        };
    };

    watch([schedulePeriod, assignment], () => goToSchedulePage(1));

    const setWasher = async (matchId: string, playerId: string | null) => {
        await matchStore.setMatchWashing(
            seasonStore.currentSeason,
            matchId,
            playerId,
        );
        toast.success(t('common.changesSaved'));
    };
</script>

<template>
    <div class="mb-8">
        <h2 class="mb-3 text-xl font-semibold">{{ t('washing.schedule') }}</h2>

        <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div class="flex w-full flex-wrap items-end gap-3 sm:w-auto">
                <UFormField
                    class="w-full sm:w-auto"
                    :label="t('washing.period.label')"
                >
                    <USelect
                        v-model="schedulePeriod"
                        class="w-full sm:w-48"
                        :items="periodOptions"
                        size="sm"
                        value-key="value"
                    />
                </UFormField>

                <UFormField
                    class="w-full sm:w-auto"
                    :label="t('washing.assignment.label')"
                >
                    <USelect
                        v-model="assignment"
                        class="w-full sm:w-48"
                        :items="assignmentOptions"
                        size="sm"
                        value-key="value"
                    />
                </UFormField>
            </div>

            <UBadge v-if="!loading">
                {{ scheduleRows.length }} {{ t('match.game', 2) }}
            </UBadge>
        </div>

        <UTable
            v-model:pagination="schedulePagination"
            class="rounded-2xl shadow-lg"
            :columns="scheduleColumns"
            :data="scheduleRows"
            :loading="loading"
            :pagination-options="{
                getPaginationRowModel: getPaginationRowModel(),
            }"
            :ui="TABLE_UI"
        >
            <template #date-cell="{ row }">
                {{
                    row.original.date
                        ? dayjs(row.original.date.toDate()).format('DD-MM-YYYY')
                        : '-'
                }}
            </template>

            <template #responsible-cell="{ row }">
                <USelect
                    v-if="isAdmin"
                    class="w-full sm:w-56"
                    :items="washingOptions"
                    :model-value="row.original.washing"
                    :placeholder="t('washing.notAssigned')"
                    size="sm"
                    value-key="value"
                    @update:model-value="setWasher(row.original.id, $event)"
                />
                <router-link
                    v-else-if="row.original.washing"
                    class="text-primary font-medium"
                    :to="{
                        name: 'playerDetail',
                        params: { id: row.original.washing },
                    }"
                >
                    <UBadge>{{ row.original.washerName }}</UBadge>
                </router-link>
                <span v-else class="text-gray-500">
                    {{ t('washing.notAssigned') }}
                </span>
            </template>

            <template #empty>
                <p class="py-4 text-center text-gray-500">
                    {{ emptyMessage }}
                </p>
            </template>
        </UTable>

        <div
            v-if="scheduleRows.length > schedulePagination.pageSize"
            class="mt-4 flex justify-center"
        >
            <UPagination
                :items-per-page="schedulePagination.pageSize"
                :page="schedulePagination.pageIndex + 1"
                :total="scheduleRows.length"
                @update:page="goToSchedulePage"
            />
        </div>
    </div>
</template>
