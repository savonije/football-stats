<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';
    import {
        Button,
        Tag,
        Column,
        DataTable,
        type DataTableRowClickEvent,
    } from 'primevue';

    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useStoreAuth } from '@/stores/authStore';
    import ProgressSpinner from '@/components/ProgressSpinner.vue';
    import TrainingWeekCalendar from '@/components/TrainingWeekCalendar.vue';
    import AddTrainingDialog from '@/components/AddTrainingDialog.vue';

    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const authStore = useStoreAuth();
    const router = useRouter();
    const { t } = useI18n();

    const showAddDialog = ref(false);
    const canEdit = computed(
        () => !!authStore.user?.id && seasonStore.isCurrentSeasonActive,
    );

    const rows = computed(() =>
        trainingStore.trainings.map((training) => ({
            id: training.id,
            date: training.date,
            cancelled: training.cancelled ?? false,
            cancelledReason: training.cancelledReason ?? '',
            presentCount: trainingStore.attendances.filter(
                (a) => a.trainingId === training.id && a.present,
            ).length,
        })),
    );

    const fetchForSeason = (seasonId: string) => {
        trainingStore.fetchTrainings(seasonId);
        trainingStore.fetchAttendances(seasonId);
    };

    onMounted(() => {
        fetchForSeason(seasonStore.currentSeason);
        playerStore.fetchPlayers();
    });

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => fetchForSeason(seasonId),
    );

    const onRowClick = (event: DataTableRowClickEvent) => {
        router.push({ name: 'trainingDetail', params: { id: event.data.id } });
    };
</script>

<template>
    <TrainingWeekCalendar />

    <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-xl font-semibold">{{ t('training.allTrainings') }}</h2>
        <Button
            v-if="canEdit"
            :label="t('training.addTraining')"
            icon="pi pi-plus"
            size="small"
            @click="showAddDialog = true"
        />
    </div>

    <div
        v-if="!trainingStore.trainingsLoaded"
        class="justify-content-center flex"
    >
        <ProgressSpinner />
    </div>

    <DataTable
        v-else
        class="rounded-2xl shadow-lg"
        :value="rows"
        paginator
        :rows="10"
        striped-rows
        sort-field="date"
        :sort-order="-1"
        data-key="id"
        @row-click="onRowClick"
    >
        <Column field="date" :header="t('common.date')" sortable>
            <template #body="{ data }">
                <span :class="{ 'text-gray-400 line-through': data.cancelled }">
                    {{
                        data.date
                            ? dayjs(data.date.toDate()).format('DD-MM-YYYY')
                            : '-'
                    }}
                </span>
            </template>
        </Column>

        <Column :header="t('training.attendance')">
            <template #body="{ data }">
                <span v-if="data.cancelled" class="text-gray-400">-</span>
                <span v-else class="font-semibold">{{ data.presentCount }}</span>
            </template>
        </Column>

        <Column :header="t('common.result')">
            <template #body="{ data }">
                <Tag
                    v-if="data.cancelled"
                    severity="danger"
                    :value="data.cancelledReason || t('training.cancelled')"
                />
                <Tag
                    v-else
                    severity="success"
                    :value="t('training.present')"
                />
            </template>
        </Column>

        <Column class="hidden text-right! sm:table-cell">
            <template #body="{ data }">
                <Button
                    as="router-link"
                    size="small"
                    :to="{ name: 'trainingDetail', params: { id: data.id } }"
                    icon="pi pi-chevron-right"
                    :aria-label="t('common.view')"
                />
            </template>
        </Column>

        <template #empty>
            <p class="py-4 text-center text-gray-500">
                {{ t('training.noTrainings') }}
            </p>
        </template>
    </DataTable>

    <AddTrainingDialog v-model:visible="showAddDialog" />
</template>
