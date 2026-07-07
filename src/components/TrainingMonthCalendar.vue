<script setup lang="ts">
    import { computed } from 'vue';
    import { useRouter } from 'vue-router';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';
    import { Button, Tag } from 'primevue';
    import type { Timestamp } from 'firebase/firestore';

    import { monthCalendarDays, weekdayOptions } from '@/utils/training';

    interface TrainingCell {
        id: string;
        date: Timestamp;
        cancelled: boolean;
        presentCount: number;
    }

    const props = defineProps<{ trainings: TrainingCell[] }>();

    // The month in view, owned by the parent so the "generate" action can
    // target it. Normalised to the start of the month for rendering.
    const month = defineModel<Date>('month', { required: true });

    const router = useRouter();
    const { t } = useI18n();

    const cursor = computed(() => dayjs(month.value).startOf('month'));

    const monthLabel = computed(() => {
        const label = cursor.value.format('MMMM YYYY');
        return label.charAt(0).toUpperCase() + label.slice(1);
    });

    const weekdayLabels = computed(() =>
        weekdayOptions().map((o) => o.label.slice(0, 2)),
    );

    // Trainings keyed by day for quick lookup while rendering the grid.
    const trainingByDay = computed(() => {
        const map = new Map<string, TrainingCell>();
        for (const training of props.trainings) {
            if (!training.date) continue;
            map.set(
                dayjs(training.date.toDate()).format('YYYY-MM-DD'),
                training,
            );
        }
        return map;
    });

    const days = computed(() =>
        monthCalendarDays(cursor.value).map((day) => {
            const key = day.format('YYYY-MM-DD');
            return {
                key,
                label: day.date(),
                inMonth: day.isSame(cursor.value, 'month'),
                isToday: day.isSame(dayjs(), 'day'),
                training: trainingByDay.value.get(key) ?? null,
            };
        }),
    );

    const prevMonth = () =>
        (month.value = cursor.value.subtract(1, 'month').toDate());
    const nextMonth = () =>
        (month.value = cursor.value.add(1, 'month').toDate());
    const goToday = () => (month.value = dayjs().startOf('month').toDate());

    const openTraining = (id: string) =>
        router.push({ name: 'trainingDetail', params: { id } });
</script>

<template>
    <div class="rounded-2xl bg-white p-3 shadow-lg sm:p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
            <Button
                icon="pi pi-chevron-left"
                text
                rounded
                size="small"
                :aria-label="t('common.view')"
                @click="prevMonth"
            />
            <div class="flex flex-1 items-center justify-center gap-3">
                <h3 class="text-lg font-semibold">{{ monthLabel }}</h3>
                <Button
                    :label="t('training.today')"
                    text
                    size="small"
                    @click="goToday"
                />
            </div>
            <Button
                icon="pi pi-chevron-right"
                text
                rounded
                size="small"
                :aria-label="t('common.view')"
                @click="nextMonth"
            />
        </div>

        <div class="mb-1 grid grid-cols-7 gap-1 text-center">
            <span
                v-for="label in weekdayLabels"
                :key="label"
                class="text-[0.6rem] font-bold tracking-wide text-gray-400 uppercase"
            >
                {{ label }}
            </span>
        </div>

        <div class="grid grid-cols-7 gap-1">
            <button
                v-for="day in days"
                :key="day.key"
                class="flex min-h-14 flex-col items-center gap-1 rounded-lg border p-1 transition-colors sm:min-h-20"
                :class="[
                    day.inMonth
                        ? 'text-primary-900 bg-white'
                        : 'bg-gray-50 text-gray-300',
                    day.training
                        ? 'hover:border-primary-300 cursor-pointer'
                        : 'cursor-default',
                    day.isToday ? 'border-primary-400' : 'border-gray-100',
                ]"
                type="button"
                :disabled="!day.training"
                @click="day.training && openTraining(day.training.id)"
            >
                <span class="text-xs font-semibold">{{ day.label }}</span>

                <template v-if="day.training">
                    <Tag
                        v-if="day.training.cancelled"
                        class="!text-[0.55rem]"
                        severity="danger"
                        :value="t('training.cancelled')"
                    />
                    <span
                        v-else
                        class="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[0.7rem] font-bold text-green-700"
                    >
                        <i class="pi pi-check text-[0.5rem]" />
                        {{ day.training.presentCount }}
                    </span>
                </template>
            </button>
        </div>
    </div>
</template>
