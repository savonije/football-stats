<script setup lang="ts">
    import { computed, onMounted, watch } from 'vue';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useStoreAuth } from '@/stores/authStore';
    import { useRouter } from 'vue-router';
    import { TOAST_LIFE } from '@/constants';
    import dayjs from 'dayjs';
    import {
        DataTable,
        Column,
        Tag,
        Select,
        type DataTableRowClickEvent,
    } from 'primevue';
    import { useToast } from 'primevue/usetoast';
    import { useI18n } from 'vue-i18n';

    const playerStore = usePlayerStore();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const authStore = useStoreAuth();
    const router = useRouter();
    const toast = useToast();
    const { t } = useI18n();

    const loading = computed(
        () => !playerStore.playersLoaded || !matchStore.matchesLoaded,
    );

    const isAdmin = computed(() => !!authStore.user?.id);

    const washingOptions = computed(() =>
        playerStore
            .playersInSeason(seasonStore.currentSeason)
            .map((player) => ({ label: player.name, value: player.id })),
    );

    /** All matches of the season, newest first, with the washer's name. */
    const scheduleRows = computed(() =>
        [...matchStore.matches]
            .sort((a, b) => (b.date?.seconds ?? 0) - (a.date?.seconds ?? 0))
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

    /** Per-player wash counts for the current season, most washes first. */
    const washCounts = computed(() => {
        const counts = new Map<string, number>();
        for (const match of matchStore.matches) {
            if (!match.washing) continue;
            counts.set(match.washing, (counts.get(match.washing) ?? 0) + 1);
        }

        return [...counts.entries()]
            .map(([playerId, count]) => ({
                id: playerId,
                name: playerStore.getPlayerById(playerId)?.name ?? '?',
                count,
            }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    });

    const onCountRowClick = (event: DataTableRowClickEvent) => {
        router.push({ name: 'playerDetail', params: { id: event.data.id } });
    };

    const setWasher = async (matchId: string, playerId: string | null) => {
        await matchStore.setMatchWashing(
            seasonStore.currentSeason,
            matchId,
            playerId,
        );
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('common.changesSaved'),
            life: TOAST_LIFE,
        });
    };

    onMounted(() => {
        playerStore.fetchPlayers();
        matchStore.fetchMatches(seasonStore.currentSeason);
    });

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => {
            matchStore.fetchMatches(seasonId);
        },
    );
</script>

<template>
    <div class="mb-8">
        <h2 class="mb-3 text-xl font-semibold">{{ t('washing.schedule') }}</h2>

        <DataTable
            class="rounded-2xl shadow-lg"
            :value="scheduleRows"
            :loading="loading"
            striped-rows
            paginator
            :rows="10"
            data-key="id"
        >
            <Column field="date" :header="$t('common.date')" sortable>
                <template #body="{ data }">
                    {{
                        data.date
                            ? dayjs(data.date.toDate()).format('DD-MM-YYYY')
                            : '-'
                    }}
                </template>
            </Column>
            <Column field="opponent" :header="$t('common.opponent')" sortable />
            <Column :header="$t('washing.responsible')">
                <template #body="{ data }">
                    <Select
                        v-if="isAdmin"
                        class="w-full sm:w-56"
                        :model-value="data.washing"
                        :options="washingOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="t('washing.notAssigned')"
                        show-clear
                        size="small"
                        @update:model-value="setWasher(data.id, $event)"
                    />
                    <router-link
                        v-else-if="data.washing"
                        class="text-primary font-medium"
                        :to="{
                            name: 'playerDetail',
                            params: { id: data.washing },
                        }"
                    >
                        <Tag :value="data.washerName" />
                    </router-link>
                    <span v-else class="text-gray-500">
                        {{ t('washing.notAssigned') }}
                    </span>
                </template>
            </Column>
            <template #empty>
                <p class="py-4 text-center text-gray-500">
                    {{ t('match.noMatches') }}
                </p>
            </template>
        </DataTable>
    </div>

    <div class="mb-8">
        <h2 class="mb-3 text-xl font-semibold">{{ t('washing.overview') }}</h2>

        <DataTable
            class="rounded-2xl shadow-lg"
            :value="washCounts"
            :loading="loading"
            striped-rows
            sort-field="count"
            :sort-order="-1"
            data-key="id"
            @row-click="onCountRowClick"
        >
            <Column field="name" :header="$t('common.name')" sortable />
            <Column field="count" :header="$t('washing.washing', 2)" sortable />
            <template #empty>
                <p class="py-4 text-center text-gray-500">
                    {{ t('washing.noWashing') }}
                </p>
            </template>
        </DataTable>
    </div>
</template>
