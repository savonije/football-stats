<script setup lang="ts">
    import type { TableColumn, TableRow } from '@nuxt/ui/components/Table.vue';
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { TABLE_UI, sortableHeader } from '@/utils/table';

    const { loading } = defineProps<{ loading: boolean }>();

    const playerStore = usePlayerStore();
    const matchStore = useMatchStore();
    const router = useRouter();
    const { t } = useI18n();

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

    type CountRow = (typeof washCounts.value)[number];

    const countColumns = computed<TableColumn<CountRow>[]>(() => [
        {
            accessorKey: 'name',
            header: sortableHeader<CountRow>(t('common.name')),
        },
        {
            accessorKey: 'count',
            header: sortableHeader<CountRow>(t('washing.washing', 2)),
        },
    ]);

    const countSorting = ref([{ id: 'count', desc: true }]);

    const onCountSelect = (_event: Event, row: TableRow<CountRow>) => {
        router.push({ name: 'playerDetail', params: { id: row.original.id } });
    };
</script>

<template>
    <div class="mb-8">
        <h2 class="mb-3 text-xl font-semibold">{{ t('washing.overview') }}</h2>

        <UTable
            v-model:sorting="countSorting"
            class="rounded-2xl shadow-lg"
            :columns="countColumns"
            :data="washCounts"
            :loading="loading"
            :ui="TABLE_UI"
            @select="onCountSelect"
        >
            <template #empty>
                <p class="py-4 text-center text-gray-500">
                    {{ t('washing.noWashing') }}
                </p>
            </template>
        </UTable>
    </div>
</template>
