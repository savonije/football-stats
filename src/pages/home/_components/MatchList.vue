<script setup lang="ts">
    import { onMounted, ref, watch } from 'vue';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useRouter } from 'vue-router';

    import dayjs from 'dayjs';
    import {
        Button,
        Tag,
        Column,
        InputText,
        InputGroup,
        InputGroupAddon,
        DataTable,
        type DataTableRowClickEvent,
    } from 'primevue';

    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';

    import { hasStarted } from '@/utils/match';

    import { useI18n } from 'vue-i18n';

    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const router = useRouter();

    const { t } = useI18n();

    const filteredCount = ref(0);

    const filters = ref({
        global: { value: null, matchMode: 'contains' },
    });

    const onFilter = (event: { filteredValue: string }) => {
        filteredCount.value =
            event.filteredValue?.length ?? matchStore.matches.length;
    };

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

    const onRowClick = (event: DataTableRowClickEvent) => {
        router.push({ name: 'matchDetail', params: { id: event.data.id } });
    };
</script>

<template>
    <div class="mb-4 flex justify-end">
        <InputGroup>
            <InputGroupAddon>
                <i class="pi pi-search"></i>
            </InputGroupAddon>
            <InputText
                v-model="filters.global.value"
                class="w-full sm:w-64"
                icon="pi-search"
                :placeholder="t('common.searchOpponent')"
            />
        </InputGroup>
    </div>

    <div class="mb-3 flex justify-end">
        <Tag v-if="matchStore.matchesLoaded">
            {{ filteredCount }} / {{ matchStore.matches.length }}
            {{ t('match.game', 2) }}
        </Tag>
    </div>

    <div v-if="!matchStore.matchesLoaded" class="justify-content-center flex">
        <ProgressSpinner />
    </div>

    <DataTable
        v-else
        v-model:filters="filters"
        class="rounded-2xl shadow-lg"
        :value="matchStore.matches"
        :loading="!matchStore.matchesLoaded"
        :global-filter-fields="['opponent']"
        paginator
        :rows="10"
        striped-rows
        sort-field="date"
        :sort-order="-1"
        data-key="id"
        @row-click="onRowClick"
        @filter="onFilter"
    >
        <Column field="date" :header="t('common.date')" sortable>
            <template #body="{ data }">
                {{
                    data.date
                        ? dayjs(data.date.toDate()).format('DD-MM-YYYY')
                        : '-'
                }}
            </template>
        </Column>

        <Column field="opponent" :header="t('common.opponent')" sortable>
            <template #body="{ data }">
                {{ data.opponent }}
            </template>
        </Column>

        <Column class="hidden sm:table-cell" :header="t('common.homeOrAway')">
            <template #body="{ data }">
                {{ data.home ? t('common.home') : t('common.away') }}
            </template>
        </Column>

        <Column class="hidden md:table-cell" :header="t('washing.washer')">
            <template #body="{ data }">
                {{
                    data.washing
                        ? (playerStore.getPlayerById(data.washing)?.name ??
                          t('washing.notAssigned'))
                        : t('washing.notAssigned')
                }}
            </template>
        </Column>

        <Column :header="t('common.result')">
            <template #body="{ data }">
                <span
                    class="font-bold"
                    :class="
                        hasStarted(data) && data.result
                            ? data.result.goalsFor > data.result.goalsAgainst
                                ? 'text-green-700'
                                : data.result.goalsFor <
                                    data.result.goalsAgainst
                                  ? 'text-red-700'
                                  : 'text-yellow-700'
                            : 'text-gray-500'
                    "
                >
                    {{
                        hasStarted(data) && data.result
                            ? `${data.result.goalsFor}-${data.result.goalsAgainst}`
                            : '-'
                    }}
                </span>
            </template>
        </Column>

        <Column class="hidden text-right! sm:table-cell">
            <template #body="{ data }">
                <Button
                    as="router-link"
                    size="small"
                    :to="{ name: 'matchDetail', params: { id: data.id } }"
                    icon="pi pi-chevron-right"
                    :aria-label="t('match.viewMatchDetails')"
                />
            </template>
        </Column>

        <template #empty>
            <p class="py-4 text-center text-gray-500">
                {{ t('match.noMatches') }}
            </p>
        </template>
    </DataTable>
</template>
