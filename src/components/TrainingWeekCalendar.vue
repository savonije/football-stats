<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';
    import { Tag } from 'primevue';

    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useStoreAuth } from '@/stores/authStore';
    import { weekDays } from '@/utils/training';
    import type { Training } from '@/types';
    import AddTrainingDialog from '@/components/AddTrainingDialog.vue';

    const { t } = useI18n();
    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const authStore = useStoreAuth();

    const showAddDialog = ref(false);
    const prefillDate = ref<Date | null>(null);

    const canEdit = computed(
        () => !!authStore.user?.id && seasonStore.isCurrentSeasonActive,
    );

    const trainingDays = computed(
        () =>
            seasonStore.seasons.find((s) => s.id === seasonStore.currentSeason)
                ?.trainingDays ?? [],
    );

    const presentCountFor = (trainingId: string) =>
        trainingStore.attendances.filter(
            (a) => a.trainingId === trainingId && a.present,
        ).length;

    const days = computed(() =>
        weekDays().map((day) => {
            const training = trainingStore.trainings.find((tr: Training) =>
                dayjs(tr.date?.toDate?.()).isSame(day, 'day'),
            );
            return {
                key: day.format('YYYY-MM-DD'),
                weekday: day.format(' dd').trim(),
                dayNumber: day.format('D'),
                isTrainingDay: trainingDays.value.includes(day.day()),
                isToday: day.isSame(dayjs(), 'day'),
                date: day.toDate(),
                training,
            };
        }),
    );

    const openAdd = (date: Date) => {
        prefillDate.value = date;
        showAddDialog.value = true;
    };
</script>

<template>
    <div class="mb-8">
        <h2 class="mb-3 text-xl font-semibold">{{ t('training.thisWeek') }}</h2>

        <div class="grid grid-cols-7 gap-1.5 sm:gap-3">
            <div
                v-for="day in days"
                :key="day.key"
                class="flex flex-col items-center gap-1 rounded-xl border p-1.5 text-center sm:p-3"
                :class="[
                    day.isTrainingDay
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-gray-100 bg-white',
                    day.isToday ? 'ring-primary-400 ring-2' : '',
                ]"
            >
                <span
                    class="text-[0.6rem] font-bold tracking-wide text-gray-400 uppercase"
                >
                    {{ day.weekday }}
                </span>
                <span class="text-primary-900 text-base font-bold sm:text-lg">
                    {{ day.dayNumber }}
                </span>

                <template v-if="day.training">
                    <router-link
                        v-if="!day.training.cancelled"
                        class="mt-0.5"
                        :to="{
                            name: 'trainingDetail',
                            params: { id: day.training.id },
                        }"
                    >
                        <Tag
                            severity="success"
                            :value="String(presentCountFor(day.training.id))"
                        />
                    </router-link>
                    <router-link
                        v-else
                        :to="{
                            name: 'trainingDetail',
                            params: { id: day.training.id },
                        }"
                    >
                        <Tag
                            severity="danger"
                            :value="t('training.cancelled')"
                            class="mt-0.5 text-[0.6rem]"
                        />
                    </router-link>
                </template>

                <button
                    v-else-if="day.isTrainingDay && canEdit"
                    class="text-primary-400 hover:text-primary-600 mt-0.5 flex size-6 items-center justify-center rounded-full transition-colors"
                    :aria-label="t('training.addTraining')"
                    @click="openAdd(day.date)"
                >
                    <i class="pi pi-plus text-xs" />
                </button>
            </div>
        </div>

        <AddTrainingDialog
            v-model:visible="showAddDialog"
            :initial-date="prefillDate"
        />
    </div>
</template>
