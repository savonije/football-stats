<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DrivingMatchCard from '@/pages/driving/_components/DrivingMatchCard.vue';

    import type { DrivingPlan } from '@/utils/driving';

    const { loading, plans } = defineProps<{
        loading: boolean;
        plans: DrivingPlan[];
    }>();

    const { t } = useI18n();

    const period = ref<'upcoming' | 'past' | 'all'>('upcoming');

    const periodOptions = computed(() =>
        (['upcoming', 'past', 'all'] as const).map((value) => ({
            label: t(`common.period.${value}`),
            value,
        })),
    );

    const rows = computed(() => {
        const list = plans.filter(
            (plan) =>
                period.value === 'all' ||
                plan.past === (period.value === 'past'),
        );
        return period.value === 'upcoming' ? list : [...list].reverse();
    });
</script>

<template>
    <div class="mb-8">
        <h2 class="mb-3 text-xl font-semibold">
            {{ t('driving.schedule') }}
        </h2>

        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <UTabs
                v-model="period"
                class="w-full sm:w-auto"
                :content="false"
                :items="periodOptions"
                size="sm"
                :ui="{ list: 'w-full', trigger: 'flex-1' }"
                variant="pill"
            />

            <UBadge v-if="!loading">
                {{ rows.length }} {{ t('match.game', rows.length) }}
            </UBadge>
        </div>

        <div v-if="loading" class="flex flex-col gap-4">
            <USkeleton v-for="n in 2" :key="n" class="h-48 rounded-xl" />
        </div>

        <p
            v-else-if="!rows.length"
            class="shadow-card rounded-xl bg-white p-5 text-center text-gray-500"
        >
            {{ t('driving.noMatches') }}
        </p>

        <div v-else class="flex flex-col gap-4">
            <DrivingMatchCard
                v-for="plan in rows"
                :key="plan.match.id"
                :plan="plan"
            />
        </div>
    </div>
</template>
