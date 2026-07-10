<script setup lang="ts">
    import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { getDisplaySeconds } from '@/utils/match';
    import { useI18n } from 'vue-i18n';
    import { Card } from 'primevue';
    import { RouterLink } from 'vue-router';

    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const { t } = useI18n();

    const now = ref(Date.now());
    let timer: ReturnType<typeof setInterval>;

    onMounted(() => {
        timer = setInterval(() => {
            now.value = Date.now();
        }, 30_000);
    });

    onUnmounted(() => clearInterval(timer));

    const liveMatch = computed(
        () =>
            matchStore.matches.find(
                (m) => (m.running || m.paused) && !m.ended,
            ) ?? null,
    );

    const currentMinute = computed(() =>
        Math.floor(
            getDisplaySeconds(
                liveMatch.value,
                seasonStore.currentHalfDuration,
                now.value,
            ) / 60,
        ),
    );

    const goalsFor = computed(() => liveMatch.value?.result?.goalsFor ?? 0);

    const goalsAgainst = computed(
        () => liveMatch.value?.result?.goalsAgainst ?? 0,
    );

    const animateFor = ref(false);
    const animateAgainst = ref(false);

    watch(goalsFor, (val, old) => {
        if (val > old) animateFor.value = true;
    });

    watch(goalsAgainst, (val, old) => {
        if (val > old) animateAgainst.value = true;
    });
</script>

<template>
    <Card v-if="liveMatch" class="mb-6">
        <template #content>
            <RouterLink
                class="block text-inherit no-underline"
                :to="{ name: 'matchDetail', params: { id: liveMatch.id } }"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <div class="mb-2 flex items-center gap-2">
                            <span class="relative flex h-3 w-3">
                                <span
                                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
                                    aria-hidden="true"
                                />
                                <span
                                    class="relative inline-flex h-3 w-3 rounded-full bg-red-500"
                                />
                            </span>
                            <span
                                class="text-sm font-semibold tracking-wide text-red-500 uppercase"
                            >
                                {{ t('match.live') }}
                            </span>
                        </div>
                        <p class="text-xl font-bold">
                            {{ liveMatch.opponent }}
                        </p>
                    </div>

                    <div class="text-right">
                        <p class="text-4xl font-bold tabular-nums">
                            <span
                                class="inline-block"
                                :class="{ 'animate-score-pop': animateFor }"
                                @animationend="animateFor = false"
                            >
                                {{ goalsFor }}
                            </span>
                            –
                            <span
                                class="inline-block"
                                :class="{
                                    'animate-score-pop': animateAgainst,
                                }"
                                @animationend="animateAgainst = false"
                            >
                                {{ goalsAgainst }}
                            </span>
                        </p>
                        <p class="mt-1 text-sm text-gray-500">
                            {{ currentMinute }}'
                        </p>
                    </div>
                </div>
            </RouterLink>
        </template>
    </Card>
</template>
