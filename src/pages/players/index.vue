<script setup lang="ts">
    import type { TableColumn, TableRow } from '@nuxt/ui/components/Table.vue';
    import { computed, onMounted, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Player } from '@/types';
    import { isGuestInSeason } from '@/utils/playerSeason';
    import { TABLE_UI, sortableHeader } from '@/utils/table';

    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';

    import router from '@/router';

    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const { t } = useI18n();

    const seasonPlayers = computed(() =>
        playerStore.playersInSeason(seasonStore.currentSeason),
    );

    const isGuest = (player: Player) =>
        isGuestInSeason(player, seasonStore.currentSeason);

    const columns = computed<TableColumn<Player>[]>(() => [
        {
            accessorKey: 'name',
            header: sortableHeader<Player>(t('common.name')),
        },
        {
            id: 'actions',
            meta: { class: { td: 'text-right', th: 'text-right' } },
        },
    ]);

    const sorting = ref([{ id: 'name', desc: false }]);

    const onSelect = (_event: Event, row: TableRow<Player>) => {
        router.push({ name: 'playerDetail', params: { id: row.original.id } });
    };

    onMounted(() => {
        playerStore.fetchPlayers();
    });
</script>

<template>
    <UTable
        v-if="playerStore.playersLoaded && seasonPlayers.length"
        v-model:sorting="sorting"
        class="rounded-2xl shadow-lg"
        :columns="columns"
        :data="seasonPlayers"
        :ui="TABLE_UI"
        @select="onSelect"
    >
        <template #name-cell="{ row }">
            <span :class="{ 'text-gray-300': isGuest(row.original) }">
                {{ row.original.name }}
            </span>
        </template>

        <template #actions-cell="{ row }">
            <UButton
                :class="{ 'opacity-50': isGuest(row.original) }"
                :aria-label="$t('player.viewPlayerDetails')"
                icon="i-lucide-chevron-right"
                size="sm"
                :to="{ name: 'playerDetail', params: { id: row.original.id } }"
            />
        </template>
    </UTable>

    <div
        v-else-if="!playerStore.playersLoaded"
        class="justify-content-center flex"
    >
        <ProgressSpinner />
    </div>

    <h1 v-else>{{ $t('player.noPlayers') }}</h1>
</template>
