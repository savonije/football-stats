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
    import GenerateTrainingsDialog from '@/components/GenerateTrainingsDialog.vue';
    import TrainingDaysDialog from '@/components/TrainingDaysDialog.vue';

    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const authStore = useStoreAuth();
    const router = useRouter();
    const { t } = useI18n();

    const showGenerateDialog = ref(false);
    const showTrainingDaysDialog = ref(false);
    const canEdit = computed(
        () => !!authStore.user?.id && seasonStore.isCurrentSeasonActive,
    );

    const rows = computed(() =>
        trainingStore.trainings.map((training) => ({
            id: training.id,
            date: training.date,
            cancelled: training.cancelled ?? false,
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
    <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-xl font-semibold">{{ t('training.allTrainings') }}</h2>
        <div v-if="canEdit" class="flex items-center gap-2">
            <Button
                icon="pi pi-cog"
                size="small"
                severity="secondary"
                text
                rounded
                :aria-label="t('training.trainingDays')"
                @click="showTrainingDaysDialog = true"
            />
            <Button
                :label="t('training.generate')"
                icon="pi pi-calendar-plus"
                size="small"
                @click="showGenerateDialog = true"
            />
        </div>
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
                    :value="t('training.cancelled')"
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

    <GenerateTrainingsDialog v-model:visible="showGenerateDialog" />
    <TrainingDaysDialog v-model:visible="showTrainingDaysDialog" />
</template>
