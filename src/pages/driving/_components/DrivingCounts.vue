<script setup lang="ts">
    import type { TableColumn } from '@nuxt/ui/components/Table.vue';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AdminOnlyNote from '@/components/ui/AdminOnlyNote.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { DriveCount } from '@/utils/driving';
    import {
        isAlwaysDriverInSeason,
        isNeverDriverInSeason,
    } from '@/utils/playerSeason';
    import { TABLE_UI } from '@/utils/table';

    const { counts, loading } = defineProps<{
        counts: Map<string, DriveCount>;
        loading: boolean;
    }>();

    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const canEdit = useCanEdit();
    const toast = useAppToast();
    const { t } = useI18n();

    const rows = computed(() =>
        playerStore
            .playersInSeason(seasonStore.currentSeason)
            .map((player) => ({
                id: player.id,
                name: player.name,
                driven: counts.get(player.id)?.driven ?? 0,
                planned: counts.get(player.id)?.planned ?? 0,
                alwaysDrives: isAlwaysDriverInSeason(
                    player,
                    seasonStore.currentSeason,
                ),
                neverDrives: isNeverDriverInSeason(
                    player,
                    seasonStore.currentSeason,
                ),
            }))
            .sort(
                (a, b) =>
                    b.driven + b.planned - (a.driven + a.planned) ||
                    a.name.localeCompare(b.name),
            ),
    );

    type CountRow = (typeof rows.value)[number];

    const columns = computed<TableColumn<CountRow>[]>(() => [
        { accessorKey: 'name', header: t('driving.parentOf') },
        { accessorKey: 'driven', header: t('driving.driven') },
        { accessorKey: 'planned', header: t('driving.planned') },
        { accessorKey: 'alwaysDrives', header: t('driving.alwaysDrives') },
        { accessorKey: 'neverDrives', header: t('driving.neverDrives') },
    ]);

    const setDrives = async (
        playerId: string,
        drives: { alwaysDrives: boolean; neverDrives: boolean },
    ) => {
        await playerStore.setDrives(
            playerId,
            seasonStore.currentSeason,
            drives,
        );
        toast.success(t('common.changesSaved'));
    };
</script>

<template>
    <div class="mb-8">
        <h2 class="mb-1 text-xl font-semibold">{{ t('driving.overview') }}</h2>
        <AdminOnlyNote class="mb-3" />

        <UTable
            class="rounded-2xl shadow-lg"
            :columns="columns"
            :data="rows"
            :loading="loading"
            :ui="TABLE_UI"
        >
            <template #alwaysDrives-cell="{ row }">
                <USwitch
                    :aria-label="
                        t('driving.alwaysDrivesLabel', {
                            name: row.original.name,
                        })
                    "
                    :disabled="!canEdit"
                    :model-value="row.original.alwaysDrives"
                    size="lg"
                    @update:model-value="
                        setDrives(row.original.id, {
                            alwaysDrives: $event,
                            neverDrives: false,
                        })
                    "
                />
            </template>

            <template #neverDrives-cell="{ row }">
                <USwitch
                    :aria-label="
                        t('driving.neverDrivesLabel', {
                            name: row.original.name,
                        })
                    "
                    :disabled="!canEdit"
                    :model-value="row.original.neverDrives"
                    size="lg"
                    @update:model-value="
                        setDrives(row.original.id, {
                            alwaysDrives: false,
                            neverDrives: $event,
                        })
                    "
                />
            </template>

            <template #empty>
                <p class="py-4 text-center text-gray-500">
                    {{ t('player.noPlayers') }}
                </p>
            </template>
        </UTable>
    </div>
</template>
