<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';
    import {
        Button,
        Column,
        DataTable,
        SelectButton,
        type DataTableRowClickEvent,
    } from 'primevue';

    import router from '@/router';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { isGuestInSeason } from '@/utils/playerSeason';
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

    const onRowClick = (event: DataTableRowClickEvent) => {
        router.push({ name: 'playerDetail', params: { id: event.data.id } });
    };
</script>

<template>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SelectButton
            v-model="period"
            :options="periodOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            size="small"
        />

        <div v-if="period !== 'total'" class="flex items-center gap-1">
            <Button
                icon="pi pi-chevron-left"
                text
                rounded
                size="small"
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
            <Button
                icon="pi pi-chevron-right"
                text
                rounded
                size="small"
                :disabled="isCurrentPeriod"
                :aria-label="
                    t(
                        period === 'week'
                            ? 'training.nextWeek'
                            : 'common.nextMonth',
                    )
                "
                @click="step(1)"
            />
            <Button
                :label="t('training.today')"
                text
                size="small"
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

    <DataTable
        v-else
        class="rounded-2xl shadow-lg"
        :value="rows"
        :loading="!playerStore.playersLoaded || !trainingStore.trainingsLoaded"
        :sortField="'percentage'"
        :sortOrder="-1"
        striped-rows
        @row-click="onRowClick"
    >
        <Column field="name" :header="$t('common.name')" sortable />
        <Column field="attended" :header="$t('training.attended')" sortable>
            <template #body="{ data }">
                {{ data.attended }} / {{ held.length }}
            </template>
        </Column>
        <Column
            field="percentage"
            :header="$t('training.attendancePercentage')"
            sortable
        >
            <template #body="{ data }"> {{ data.percentage }}% </template>
        </Column>
    </DataTable>
</template>
