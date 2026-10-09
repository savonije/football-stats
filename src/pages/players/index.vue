<script setup lang="ts">
    import { computed, onMounted, watch } from 'vue';
    import { RouterLink } from 'vue-router';

    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';

    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { isGuestInSeason } from '@/utils/playerSeason';

    const playerStore = usePlayerStore();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();

    const squad = computed(() =>
        playerStore
            .playersInSeason(seasonStore.currentSeason)
            .map((player) => {
                const appearances = matchStore.appearances.filter(
                    (a) => a.playerId === player.id && a.present,
                );

                return {
                    ...player,
                    guest: isGuestInSeason(player, seasonStore.currentSeason),
                    stats: [
                        {
                            icon: 'i-lucide-calendar',
                            label: 'player.totalAppearances',
                            value: appearances.length,
                        },
                        {
                            icon: 'i-lucide-volleyball',
                            label: 'player.totalGoals',
                            value: appearances.reduce(
                                (sum, a) => sum + (a.goals || 0),
                                0,
                            ),
                        },
                        {
                            icon: 'i-lucide-hand',
                            label: 'player.totalKeeper',
                            value: appearances.filter((a) => a.isGoalkeeper)
                                .length,
                        },
                    ],
                };
            })
            .sort(
                (a, b) =>
                    Number(a.guest) - Number(b.guest) ||
                    a.name.localeCompare(b.name),
            ),
    );

    onMounted(() => {
        playerStore.fetchPlayers();
        matchStore.fetchAppearances(seasonStore.currentSeason);
    });

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => {
            matchStore.fetchAppearances(seasonId);
        },
    );
</script>

<template>
    <ul
        v-if="playerStore.playersLoaded && squad.length"
        class="xs:grid-cols-2 grid gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
        data-testid="player-list"
    >
        <li
            v-for="(player, index) in squad"
            :key="player.id"
            class="stagger animate-slide-in"
            :style="{ '--i': index }"
        >
            <RouterLink
                class="shadow-card group flex h-full flex-col overflow-hidden rounded-2xl bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
                :class="{ 'opacity-60': player.guest }"
                :to="{ name: 'playerDetail', params: { id: player.id } }"
            >
                <div
                    class="relative flex flex-col items-center gap-2 px-3 pt-5 pb-4 [background:var(--gradient-brand)]"
                >
                    <span
                        class="relative flex size-16 items-center justify-center rounded-full border-[3px] border-white/25 bg-white/12 text-2xl font-black text-white transition group-hover:scale-105 sm:size-20 sm:text-3xl"
                    >
                        <span aria-hidden="true">
                            {{ player.name.charAt(0).toUpperCase() }}
                        </span>

                        <span
                            v-if="player.guest"
                            class="text-xxs tracking-badge bg-primary-900 absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-white/25 px-2 py-0.5 font-mono font-bold whitespace-nowrap text-white/75 uppercase"
                        >
                            {{ $t('player.guestPlayer') }}
                        </span>
                    </span>

                    <span
                        class="relative w-full truncate text-center font-bold text-white sm:text-lg"
                    >
                        {{ player.name }}
                    </span>
                </div>

                <dl
                    class="divide-primary-100 grid flex-1 grid-cols-3 divide-x py-3"
                >
                    <div
                        v-for="stat in player.stats"
                        :key="stat.label"
                        class="flex flex-col items-center gap-0.5"
                        :title="$t(stat.label)"
                    >
                        <dt class="text-primary-400">
                            <UIcon class="size-4" :name="stat.icon" />
                            <span class="sr-only">{{ $t(stat.label) }}</span>
                        </dt>
                        <dd
                            class="text-primary-950 text-lg leading-none font-black"
                        >
                            <USkeleton
                                v-if="!matchStore.appearancesLoaded"
                                class="h-4.5 w-4"
                            />
                            <template v-else>{{ stat.value }}</template>
                        </dd>
                    </div>
                </dl>
            </RouterLink>
        </li>
    </ul>

    <div
        v-else-if="!playerStore.playersLoaded"
        class="justify-content-center flex"
    >
        <ProgressSpinner />
    </div>

    <h1 v-else>{{ $t('player.noPlayers') }}</h1>
</template>
