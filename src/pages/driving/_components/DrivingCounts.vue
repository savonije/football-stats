<script setup lang="ts">
    import type { TableColumn } from '@nuxt/ui/components/Table.vue';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { DriveCount } from '@/utils/driving';
    import { playerSeasonInfo } from '@/utils/playerSeason';
    import { TABLE_UI } from '@/utils/table';

    const { counts, loading } = defineProps<{
        counts: Map<string, DriveCount>;
        loading: boolean;
    }>();

    const matchStore = useMatchStore();
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
                alwaysDrives:
                    playerSeasonInfo(player, seasonStore.currentSeason)
                        ?.alwaysDrives === true,
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
    ]);

    const setAlwaysDrives = async (playerId: string, alwaysDrives: boolean) => {
        await playerStore.setAlwaysDrives(
            playerId,
            seasonStore.currentSeason,
            alwaysDrives,
            matchStore.matches
                .filter((match) => !match.home && !match.driving?.alwaysDrives)
                .map((match) => match.id),
        );
        toast.success(t('common.changesSaved'));
    };
</script>

<template>
    <div class="mb-8">
        <h2 class="mb-3 text-xl font-semibold">{{ t('driving.overview') }}</h2>

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
                        setAlwaysDrives(row.original.id, $event)
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
