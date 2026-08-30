<script setup lang="ts">
    import { useTimestamp } from '@vueuse/core';
    import { computed } from 'vue';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useI18n } from 'vue-i18n';
    import { useAppToast } from '@/composables/useAppToast';
    import { useConfirmDialog } from '@/composables/useConfirmDialog';
    import {
        formatMatchTime,
        getDisplaySeconds,
        hasStarted,
        isInOvertime,
    } from '@/utils/match';

    interface Props {
        seasonId: string;
    }

    const { seasonId } = defineProps<Props>();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const toast = useAppToast();
    const confirm = useConfirmDialog();
    const { t } = useI18n();

    const now = useTimestamp({ interval: 1000 });

    const duration = computed(() =>
        formatMatchTime(
            getDisplaySeconds(
                matchStore.selectedMatch,
                seasonStore.currentHalfDuration,
                now.value,
            ),
        ),
    );

    const overtime = computed(() =>
        isInOvertime(
            matchStore.selectedMatch,
            seasonStore.currentHalfDuration,
            now.value,
        ),
    );

    const isRunning = computed(() => matchStore.selectedMatch?.running);
    const isEnded = computed(() => matchStore.selectedMatch?.ended);
    const isHalfTime = computed(() => matchStore.selectedMatch?.halfTime);
    const started = computed(() => hasStarted(matchStore.selectedMatch));
    const half = computed(() => matchStore.selectedMatch?.half ?? 1);

    const halfLabel = computed(() => {
        if (isHalfTime.value) return t('match.halfTime');
        if (!started.value || isEnded.value) return '';
        return half.value === 2 ? t('match.secondHalf') : t('match.firstHalf');
    });

    const startMatch = () => {
        if (!matchStore.selectedMatch?.id) return;
        matchStore.startMatch(seasonId, matchStore.selectedMatch.id);
    };

    const endFirstHalf = async () => {
        if (!matchStore.selectedMatch?.id) return;

        const confirmed = await confirm({
            title: t('match.endFirstHalf'),
            message: t('match.endFirstHalfConfirm'),
            confirmLabel: t('match.endFirstHalf'),
        });

        if (!confirmed) return;

        await matchStore.endFirstHalf(seasonId, matchStore.selectedMatch.id);
        toast.success(t('match.messages.firstHalfEnded'));
    };

    const startSecondHalf = () => {
        if (!matchStore.selectedMatch?.id) return;
        matchStore.startSecondHalf(seasonId, matchStore.selectedMatch.id);
    };

    const endMatch = async () => {
        if (!matchStore.selectedMatch?.id) return;

        const confirmed = await confirm({
            title: t('match.endMatch'),
            message: t('match.endMatchConfirm'),
            confirmLabel: t('match.endMatch'),
        });

        if (!confirmed) return;

        await matchStore.endMatch(seasonId, matchStore.selectedMatch.id);
        toast.success(t('match.endMatchSuccess'));
    };
</script>

<template>
    <div v-if="matchStore.selectedMatch">
        <div
            v-if="!isEnded"
            class="mt-4 mb-6 flex flex-col items-center justify-between rounded-lg bg-gray-50 p-4 shadow md:flex-row"
        >
            <div class="flex w-full items-center gap-3 md:w-auto">
                <div class="flex items-center gap-3 text-2xl font-bold">
                    <span v-if="isRunning" class="relative flex h-3 w-3">
                        <span
                            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
                            aria-hidden="true"
                        />
                        <span
                            class="relative inline-flex h-3 w-3 rounded-full bg-red-500"
                        />
                    </span>
                    <span
                        :class="{ 'text-red-600': overtime }"
                        data-testid="match-clock"
                    >
                        {{ duration }}
                    </span>
                </div>

                <div v-if="halfLabel" class="mt-1 font-semibold text-gray-500">
                    {{ halfLabel }}
                </div>
            </div>

            <div
                v-if="seasonStore.isCurrentSeasonActive"
                class="mt-4 flex gap-2 md:mt-0"
            >
                <UButton
                    v-if="!started"
                    color="success"
                    :label="t('common.start')"
                    @click="startMatch"
                />
                <UButton
                    v-if="isRunning && half === 1"
                    color="warning"
                    :label="t('match.endFirstHalf')"
                    @click="endFirstHalf"
                />
                <UButton
                    v-if="isHalfTime"
                    color="success"
                    :label="t('match.startSecondHalf')"
                    @click="startSecondHalf"
                />
                <UButton
                    v-if="isRunning && half === 2"
                    color="error"
                    :label="t('match.endMatch')"
                    @click="endMatch"
                />
            </div>
        </div>
        <div v-else class="flex justify-end">
            <UBadge
                class="mb-6 text-gray-500 italic"
                color="neutral"
                variant="subtle"
            >
                {{ t('match.isEnded') }}
            </UBadge>
        </div>
    </div>
</template>
