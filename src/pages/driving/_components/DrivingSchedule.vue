<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DrivingMatchCard from '@/pages/driving/_components/DrivingMatchCard.vue';
    import ExtraCarDialog from '@/pages/driving/_components/ExtraCarDialog.vue';

    import { useMatchStore } from '@/stores/matchStore';
    import type { DrivingPlan } from '@/utils/driving';

    const { loading, plans } = defineProps<{
        loading: boolean;
        plans: DrivingPlan[];
    }>();

    const matchStore = useMatchStore();
    const { t } = useI18n();

    type SchedulePeriod = 'upcoming' | 'past' | 'all';

    const period = ref<SchedulePeriod>('upcoming');

    const periodOptions = computed(() =>
        (['upcoming', 'past', 'all'] as const).map((value) => ({
            label: t(`washing.period.${value}`),
            value,
        })),
    );

    const rows = computed(() =>
        plans
            .filter((plan) =>
                period.value === 'all'
                    ? true
                    : plan.past === (period.value === 'past'),
            )
            .flatMap((plan) => {
                const match = matchStore.matches.find(
                    (m) => m.id === plan.matchId,
                );
                return match ? [{ match, plan }] : [];
            })
            .sort((a, b) => {
                const diff = a.match.date.seconds - b.match.date.seconds;
                return period.value === 'upcoming' ? diff : -diff;
            }),
    );

    const extraCarFor = ref<string | null>(null);
    const extraCarRow = computed(() =>
        rows.value.find((row) => row.match.id === extraCarFor.value),
    );
    const extraCarOpen = computed({
        get: () => !!extraCarRow.value,
        set: (open) => {
            if (!open) extraCarFor.value = null;
        },
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
                v-for="row in rows"
                :key="row.match.id"
                :match="row.match"
                :plan="row.plan"
                @add-car="extraCarFor = row.match.id"
            />
        </div>

        <ExtraCarDialog
            v-if="extraCarRow"
            v-model:open="extraCarOpen"
            :match="extraCarRow.match"
            :plan="extraCarRow.plan"
        />
    </div>
</template>
