<script setup lang="ts">
    import { useTimestamp } from '@vueuse/core';
    import { computed, reactive, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { RouterLink } from 'vue-router';

    import { CLUBNAME } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { ScoreSide } from '@/utils/match';
    import {
        getDisplaySeconds,
        getHalfProgress,
        getScoreSides,
        hasStarted,
        isInOvertime,
    } from '@/utils/match';

    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const { t } = useI18n();

    const now = useTimestamp({ interval: 30_000 });

    const liveMatch = computed(
        () => matchStore.matches.find((m) => hasStarted(m) && !m.ended) ?? null,
    );

    const halfDuration = computed(() => seasonStore.currentHalfDuration);

    const currentMinute = computed(() =>
        Math.floor(
            getDisplaySeconds(liveMatch.value, halfDuration.value, now.value) /
                60,
        ),
    );

    const progress = computed(() =>
        getHalfProgress(liveMatch.value, halfDuration.value, now.value),
    );

    const overtime = computed(() =>
        isInOvertime(liveMatch.value, halfDuration.value, now.value),
    );

    const minutesLeft = computed(() =>
        Math.ceil(halfDuration.value * (1 - progress.value)),
    );

    const isHalfTime = computed(() => !!liveMatch.value?.halfTime);

    const isPaused = computed(
        () => !!liveMatch.value?.paused && !isHalfTime.value,
    );

    const statusLabel = computed(() => {
        if (isHalfTime.value) return t('match.halfTime');

        return liveMatch.value?.half === 2
            ? t('match.secondHalf')
            : t('match.firstHalf');
    });

    const sides = computed<ScoreSide[]>(() =>
        liveMatch.value ? getScoreSides(liveMatch.value, CLUBNAME) : [],
    );

    const goalsFor = computed(() => liveMatch.value?.result?.goalsFor ?? 0);

    const goalsAgainst = computed(
        () => liveMatch.value?.result?.goalsAgainst ?? 0,
    );

    /** Which side is ahead, or null at a draw — drives the dimming below. */
    const leader = computed<ScoreSide['type'] | null>(() => {
        if (goalsFor.value === goalsAgainst.value) return null;
        return goalsFor.value > goalsAgainst.value ? 'for' : 'against';
    });

    const animate = reactive<Record<ScoreSide['type'], boolean>>({
        for: false,
        against: false,
    });

    watch(goalsFor, (val, old) => {
        if (val > old) animate.for = true;
    });

    watch(goalsAgainst, (val, old) => {
        if (val > old) animate.against = true;
    });
</script>

<template>
    <div
        v-if="liveMatch"
        class="shadow-hero relative overflow-hidden rounded-2xl [background:var(--gradient-brand)]"
    >
        <div
            class="pointer-events-none absolute inset-0 [background:repeating-linear-gradient(-55deg,transparent,transparent_20px,rgba(255,255,255,0.015)_20px,rgba(255,255,255,0.015)_40px)]"
            aria-hidden="true"
        />

        <RouterLink
            class="relative z-10 block p-5 text-inherit no-underline sm:p-6"
            :to="{ name: 'matchDetail', params: { id: liveMatch.id } }"
        >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                    v-if="isPaused"
                    class="tracking-badge text-xxs flex items-center gap-1.5 font-mono font-bold text-amber-300 uppercase"
                >
                    <UIcon name="i-lucide-pause" />
                    {{ t('match.paused') }}
                </span>

                <span
                    v-else
                    class="tracking-badge text-xxs flex items-center gap-1.5 font-mono font-bold text-red-300 uppercase"
                >
                    <span class="relative flex size-2.5">
                        <span
                            class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75"
                            aria-hidden="true"
                        />
                        <span
                            class="relative inline-flex size-2.5 rounded-full bg-red-500"
                        />
                    </span>
                    {{ t('match.live') }}
                </span>

                <span class="text-amber text-sm font-bold tabular-nums">
                    {{ currentMinute }}&prime;
                </span>

                <span
                    class="tracking-badge text-xxs text-primary-200 font-mono font-bold uppercase"
                >
                    {{ statusLabel }}
                </span>
            </div>

            <div class="mt-2 flex flex-col gap-0.5">
                <div
                    v-for="side in sides"
                    :key="side.type"
                    class="flex items-baseline gap-3"
                    :class="
                        leader && leader !== side.type
                            ? 'text-primary-300'
                            : 'text-white'
                    "
                >
                    <span
                        class="min-w-0 flex-1 truncate text-lg font-bold sm:text-xl"
                    >
                        {{ side.name }}
                    </span>

                    <span
                        class="text-3xl leading-none font-black tabular-nums"
                        :class="{
                            'animate-score-pop': animate[side.type],
                        }"
                        @animationend="animate[side.type] = false"
                    >
                        {{ side.goals }}
                    </span>
                </div>
            </div>

            <div class="mt-3 flex items-center gap-3">
                <span
                    class="h-1.5 w-full overflow-hidden rounded-full bg-white/20"
                >
                    <span
                        class="block h-full rounded-full"
                        :class="overtime ? 'bg-red-500' : 'bg-amber'"
                        :style="{ width: `${progress * 100}%` }"
                    />
                </span>

                <span
                    v-if="minutesLeft > 0"
                    class="text-primary-200 shrink-0 text-xs font-semibold"
                >
                    {{ t('match.minutesLeft', { count: minutesLeft }) }}
                </span>
            </div>
        </RouterLink>
    </div>
</template>
