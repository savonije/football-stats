<script setup lang="ts">
    import type { TableColumn, TableRow } from '@nuxt/ui/components/Table.vue';
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';

    import router from '@/router';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { isGuestInSeason } from '@/utils/playerSeason';
    import { TABLE_UI, sortableHeader } from '@/utils/table';
    import {
        attendancePercentage,
        heldTrainings,
        trainingsInPeriod,
        type AttendancePeriod,
    } from '@/utils/training';

    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const trainingStore = useTrainingStore();

    const { t } = useI18n();

    const period = ref<AttendancePeriod>('total');
    const anchor = ref<Date>(new Date());

    const periodOptions = computed(() =>
        (['week', 'month', 'total'] as const).map((value) => ({
            label: t(`training.period.${value}`),
            value,
        })),
    );

    const periodLabel = computed(() => {
        const date = dayjs(anchor.value);
        const label =
            period.value === 'week'
                ? `${date.startOf('week').format('D MMM')} – ${date.endOf('week').format('D MMM YYYY')}`
                : date.format('MMMM YYYY');
        return label.charAt(0).toUpperCase() + label.slice(1);
    });

    const isCurrentPeriod = computed(
        () =>
            period.value !== 'total' &&
            dayjs(anchor.value).isSame(dayjs(), period.value),
    );

    const step = (amount: number) => {
        if (period.value === 'total') return;
        if (amount > 0 && isCurrentPeriod.value) return;

        anchor.value = dayjs(anchor.value)
            .add(amount, period.value)
            .startOf(period.value)
            .toDate();
    };

    const goToToday = () => (anchor.value = new Date());

    const held = computed(() =>
        heldTrainings(
            trainingsInPeriod(
                trainingStore.trainings,
                period.value,
                anchor.value,
            ),
        ),
    );

    const rows = computed(() =>
        playerStore
            .playersInSeason(seasonStore.currentSeason)
            .filter(
                (player) => !isGuestInSeason(player, seasonStore.currentSeason),
            )
            .map((player) => ({
                id: player.id,
                name: player.name,
                attended: held.value.filter((training) =>
                    training.presentPlayerIds?.includes(player.id),
                ).length,
                percentage: attendancePercentage(player.id, held.value),
            })),
    );

    type AttendanceRow = (typeof rows.value)[number];

    const columns = computed<TableColumn<AttendanceRow>[]>(() => [
        {
            accessorKey: 'name',
            header: sortableHeader<AttendanceRow>(t('common.name')),
        },
        {
            accessorKey: 'attended',
            header: sortableHeader<AttendanceRow>(t('training.attended')),
        },
        {
            accessorKey: 'percentage',
            header: sortableHeader<AttendanceRow>(
                t('training.attendancePercentage'),
            ),
        },
    ]);

    const sorting = ref([{ id: 'percentage', desc: true }]);

    const onSelect = (_event: Event, row: TableRow<AttendanceRow>) => {
        router.push({ name: 'playerDetail', params: { id: row.original.id } });
    };
</script>

<template>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <UTabs
            v-model="period"
            :content="false"
            :items="periodOptions"
            size="sm"
            variant="pill"
        />

        <div v-if="period !== 'total'" class="flex items-center gap-1">
            <UButton
                class="rounded-full"
                color="neutral"
                icon="i-lucide-chevron-left"
                size="sm"
                variant="ghost"
                :aria-label="
                    t(
                        period === 'week'
                            ? 'training.previousWeek'
                            : 'common.previousMonth',
                    )
                "
                @click="step(-1)"
            />
            <span class="min-w-40 text-center text-sm font-semibold">
                {{ periodLabel }}
            </span>
            <UButton
                class="rounded-full"
                color="neutral"
                :disabled="isCurrentPeriod"
                icon="i-lucide-chevron-right"
                size="sm"
                variant="ghost"
                :aria-label="
                    t(
                        period === 'week'
                            ? 'training.nextWeek'
                            : 'common.nextMonth',
                    )
                "
                @click="step(1)"
            />
            <UButton
                color="neutral"
                :label="t('training.today')"
                size="sm"
                variant="ghost"
                @click="goToToday"
            />
        </div>
    </div>

    <p
        v-if="trainingStore.trainingsLoaded && !held.length"
        class="rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-lg"
    >
        {{ $t('training.noTrainingsInPeriod') }}
    </p>

    <UTable
        v-else
        v-model:sorting="sorting"
        class="rounded-2xl shadow-lg"
        :columns="columns"
        :data="rows"
        :loading="!playerStore.playersLoaded || !trainingStore.trainingsLoaded"
        :ui="TABLE_UI"
        @select="onSelect"
    >
        <template #attended-cell="{ row }">
            {{ row.original.attended }} / {{ held.length }}
        </template>
        <template #percentage-cell="{ row }">
            {{ row.original.percentage }}%
        </template>
    </UTable>
</template>
