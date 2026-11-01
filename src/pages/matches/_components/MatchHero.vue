<script setup lang="ts">
    import { useIntervalFn, useTimestamp } from '@vueuse/core';
    import dayjs from 'dayjs';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import MatchControls from '@/pages/matches/_components/MatchControls.vue';
    import ScoreBoard from '@/pages/matches/_components/ScoreBoard.vue';

    import { CLUBNAME } from '@/constants';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Match } from '@/types';
    import { hasKickoffTime } from '@/utils/date';
    import {
        formatMatchTime,
        getDisplaySeconds,
        getFinalSeconds,
        getHalfProgress,
        hasStarted,
        isInOvertime,
    } from '@/utils/match';

    const { match, seasonId } = defineProps<{
        match: Match;
        seasonId: string;
    }>();

    const seasonStore = useSeasonStore();
    const { t } = useI18n();

    const now = useTimestamp({
        scheduler: (cb) => useIntervalFn(cb, 1000),
    });

    const halfDuration = computed(() => seasonStore.currentHalfDuration);
    const half = computed(() => match.half ?? 1);
    const date = computed(() => match.date.toDate());

    const started = computed(() => hasStarted(match));
    const isHalfTime = computed(() => !!match.halfTime && !match.ended);
    const isPaused = computed(
        () =>
            started.value &&
            !!match.paused &&
            !isHalfTime.value &&
            !match.ended,
    );
    const isLive = computed(() => started.value && !match.paused);

    const seconds = computed(() =>
        getDisplaySeconds(match, halfDuration.value, now.value),
    );
    const overtime = computed(
        () =>
            !match.ended && isInOvertime(match, halfDuration.value, now.value),
    );

    /** The home side is named first, which is what says home or away. */
    const title = computed(() =>
        match.home
            ? `${CLUBNAME} - ${match.opponent}`
            : `${match.opponent} - ${CLUBNAME}`,
    );

    const badge = computed(() => {
        if (match.ended)
            return { label: t('match.isEnded'), class: 'bg-white/15' };
        if (isHalfTime.value)
            return {
                label: t('match.halfTime'),
                class: 'bg-white text-primary-900',
            };
        if (isPaused.value)
            return {
                label: t('match.paused'),
                class: 'bg-amber text-primary-950',
                icon: 'i-lucide-pause',
            };
        if (isLive.value)
            return { label: t('match.live'), class: 'bg-red-600', live: true };

        const period = seasonStore.periodNumberOf(date.value);
        return {
            label: [
                match.home ? t('common.home') : t('common.away'),
                period && t('seasons.periodLabel', { n: period }),
            ]
                .filter(Boolean)
                .join(' · '),
            class: 'bg-white/15',
        };
    });

    const status = computed(() => {
        if (!started.value || match.ended)
            return date.value.toLocaleDateString('nl-NL', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
            });
        if (isHalfTime.value) return t('match.firstHalfPlayed');

        return half.value === 2 ? t('match.secondHalf') : t('match.firstHalf');
    });

    const clockHint = computed(() => {
        if (overtime.value)
            return t('match.overtime', {
                time: formatMatchTime(
                    seconds.value - half.value * halfDuration.value * 60,
                ),
            });
        if (isPaused.value) return t('match.clockStopped');

        return t('match.minutesLeft', {
            count: Math.min(
                halfDuration.value,
                Math.ceil(
                    (half.value * halfDuration.value * 60 - seconds.value) / 60,
                ),
            ),
        });
    });

    const clockClass = computed(() => {
        if (overtime.value) return 'text-red-300';
        return isPaused.value ? 'text-amber-300' : '';
    });

    const progress = computed(() =>
        getHalfProgress(match, halfDuration.value, now.value),
    );

    /** One bar per half: the first fills up, then hands over to the second. */
    const bars = computed(() => {
        const current = overtime.value
            ? 'bg-red-300'
            : isPaused.value
              ? 'bg-amber-300'
              : 'bg-white';
        const done = match.ended ? 'bg-white/55' : 'bg-white';

        if (match.ended)
            return [
                { fill: 1, class: done },
                { fill: half.value === 2 ? 1 : 0, class: done },
            ];
        if (half.value === 2)
            return [
                { fill: 1, class: done },
                { fill: progress.value, class: current },
            ];

        return [
            { fill: isHalfTime.value ? 1 : progress.value, class: current },
            { fill: 0, class: current },
        ];
    });
</script>

<template>
    <section
        class="shadow-hero rounded-2xl p-5 text-white [background:var(--gradient-hero)]"
        data-testid="match-hero"
    >
        <h1 class="sr-only">{{ title }}</h1>

        <div class="flex items-center justify-between gap-3">
            <span
                class="tracking-badge text-xxs flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono font-bold uppercase"
                :class="badge.class"
            >
                <span
                    v-if="badge.live"
                    class="size-1.5 rounded-full bg-white motion-safe:animate-pulse"
                    aria-hidden="true"
                />
                <UIcon v-if="badge.icon" class="size-3" :name="badge.icon" />
                {{ badge.label }}
            </span>

            <span class="text-sm font-semibold" data-testid="match-status">
                {{ status }}
            </span>
        </div>

        <ScoreBoard class="mt-5" :match="match">
            <div v-if="match.ended" class="flex flex-col items-center gap-1.5">
                <span
                    class="tracking-badge text-xxs text-primary-100 font-mono font-bold uppercase"
                >
                    {{ t('match.finalScore') }}
                </span>
                <span
                    class="text-primary-100 text-xs tabular-nums"
                    data-testid="match-final-time"
                >
                    {{ formatMatchTime(getFinalSeconds(match, halfDuration)) }}
                </span>
            </div>

            <div
                v-else-if="isHalfTime"
                class="flex flex-col items-center gap-1"
            >
                <span class="text-2xl leading-none font-extrabold">
                    {{ t('match.halfTime') }}
                </span>
                <span class="text-primary-100 text-xs">
                    {{
                        t('match.halfTimeAt', {
                            time: formatMatchTime(seconds),
                        })
                    }}
                </span>
            </div>

            <div v-else-if="started" class="flex flex-col items-center gap-1">
                <span
                    class="text-2xl leading-none font-extrabold tabular-nums"
                    :class="clockClass"
                    data-testid="match-clock"
                >
                    {{ formatMatchTime(seconds) }}
                </span>
                <span
                    class="text-primary-100 text-xs"
                    :class="{ 'font-bold text-red-300': overtime }"
                >
                    {{ clockHint }}
                </span>
            </div>

            <div
                v-else-if="hasKickoffTime(date)"
                class="flex flex-col items-center gap-1"
            >
                <span class="text-3xl leading-none font-black tabular-nums">
                    {{ dayjs(date).format('HH:mm') }}
                </span>
                <span
                    class="tracking-badge text-xxs text-primary-100 font-mono font-bold uppercase"
                >
                    {{ t('match.kickoff') }}
                </span>
            </div>

            <div v-else class="flex flex-col items-center gap-1">
                <span
                    class="text-2xl leading-none font-extrabold tabular-nums"
                    data-testid="match-clock"
                >
                    {{ formatMatchTime(0) }}
                </span>
                <span class="text-primary-100 text-xs">
                    {{ t('match.noScoreYet') }}
                </span>
            </div>
        </ScoreBoard>

        <div v-if="started && !match.ended" class="mt-5">
            <div class="grid grid-cols-2 gap-1.5">
                <div
                    v-for="(bar, index) in bars"
                    :key="index"
                    class="h-2 overflow-hidden rounded-full bg-white/15"
                >
                    <div
                        class="h-full rounded-full"
                        :class="bar.class"
                        :style="{ width: `${bar.fill * 100}%` }"
                    />
                </div>
            </div>

            <div
                class="text-xxs text-primary-100 mt-1.5 flex justify-between font-mono"
            >
                <span>0'</span>
                <span>{{ t('match.halfTime') }}</span>
                <span>{{ halfDuration * 2 }}'</span>
            </div>
        </div>

        <MatchControls :season-id="seasonId" />
    </section>
</template>
