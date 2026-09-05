<script setup lang="ts">
    import { useTimestamp } from '@vueuse/core';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import {
        formatMatchTime,
        getDisplaySeconds,
        getFinalSeconds,
        getHalfProgress,
        hasStarted,
        isInOvertime,
    } from '@/utils/match';

    /** Matches the `r` of both ring circles below. */
    const RING_RADIUS = 58;
    const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const { t } = useI18n();

    const now = useTimestamp({ interval: 1000 });

    const match = computed(() => matchStore.selectedMatch);
    const halfDuration = computed(() => seasonStore.currentHalfDuration);

    const started = computed(() => hasStarted(match.value));
    const isEnded = computed(() => !!match.value?.ended);
    const isRunning = computed(() => !!match.value?.running);
    const isHalfTime = computed(() => !!match.value?.halfTime);

    const isPaused = computed(
        () =>
            !!match.value?.paused &&
            started.value &&
            !isHalfTime.value &&
            !isEnded.value,
    );

    const duration = computed(() =>
        formatMatchTime(
            isEnded.value
                ? getFinalSeconds(match.value, halfDuration.value)
                : getDisplaySeconds(match.value, halfDuration.value, now.value),
        ),
    );

    const overtime = computed(
        () =>
            !isEnded.value &&
            isInOvertime(match.value, halfDuration.value, now.value),
    );

    const progress = computed(() =>
        isEnded.value
            ? 1
            : getHalfProgress(match.value, halfDuration.value, now.value),
    );

    const dashOffset = computed(() => RING_LENGTH * (1 - progress.value));

    const ringClass = computed(() => {
        if (overtime.value) return 'stroke-red-500';
        return isEnded.value ? 'stroke-primary-200' : 'stroke-amber';
    });

    const statusLabel = computed(() => {
        if (isEnded.value) return t('match.played');
        if (isHalfTime.value) return t('match.halfTime');
        if (!started.value) return t('match.notStarted');

        return match.value?.half === 2
            ? t('match.secondHalf')
            : t('match.firstHalf');
    });
</script>

<template>
    <div class="relative flex items-center gap-4 p-5 sm:justify-center">
        <div class="size-16 shrink-0 sm:size-34">
            <svg class="size-full -rotate-90" viewBox="0 0 136 136">
                <circle
                    class="stroke-primary-100"
                    cx="68"
                    cy="68"
                    fill="none"
                    r="58"
                    stroke-width="10"
                />
                <circle
                    v-if="started"
                    :class="ringClass"
                    cx="68"
                    cy="68"
                    fill="none"
                    r="58"
                    :stroke-dasharray="RING_LENGTH"
                    :stroke-dashoffset="dashOffset"
                    stroke-linecap="round"
                    stroke-width="10"
                />
            </svg>
        </div>

        <div
            class="flex flex-col sm:absolute sm:inset-0 sm:items-center sm:justify-center"
        >
            <span
                class="text-2xl leading-none font-black tabular-nums sm:text-3xl"
                :class="overtime ? 'text-red-600' : 'text-primary-900'"
                :data-testid="isEnded ? 'match-final-time' : 'match-clock'"
            >
                {{ duration }}
            </span>

            <span
                class="text-xxs tracking-badge text-primary-400 mt-1.5 font-bold uppercase"
                data-testid="match-status"
            >
                {{ statusLabel }}
            </span>

            <UBadge
                v-if="isRunning"
                class="tracking-badge text-xxs mt-2 gap-1.5 font-bold uppercase sm:absolute sm:top-4 sm:left-4"
                color="error"
                variant="subtle"
            >
                <span class="relative flex size-1.5">
                    <span
                        class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75"
                        aria-hidden="true"
                    />
                    <span
                        class="relative inline-flex size-1.5 rounded-full bg-red-500"
                    />
                </span>
                {{ t('match.live') }}
            </UBadge>

            <UBadge
                v-else-if="isPaused"
                class="tracking-badge text-xxs mt-2 font-bold uppercase sm:absolute sm:top-4 sm:left-4"
                color="warning"
                icon="i-lucide-pause"
                :label="t('match.isPaused')"
                variant="subtle"
            />
        </div>
    </div>
</template>
