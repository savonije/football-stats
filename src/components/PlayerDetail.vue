<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useStoreAuth } from '@/stores/authStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { TOAST_LIFE } from '@/constants';
    import { useToast } from 'primevue/usetoast';

    import {
        Skeleton,
        Card,
        Dialog,
        InputText,
        Checkbox,
        Select,
        Button,
    } from 'primevue';
    import type { Player } from '@/types';
    import { isGuestInSeason, playerSeasonInfo } from '@/utils/playerSeason';
    import { useI18n } from 'vue-i18n';
    import PlayerGoalsChart from '@/components/PlayerGoalsChart.vue';
    import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
    import PlayerInfoRow from '@/components/PlayerInfoRow.vue';
    import PlayerStatTile from '@/components/PlayerStatTile.vue';

    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const AuthStore = useStoreAuth();
    const seasonStore = useSeasonStore();
    const route = useRoute();
    const toast = useToast();
    const { t } = useI18n();

    const playerId = computed(() => route.params.id as string);
    const player = ref<Player | null>(null);
    const loading = ref(true);
    const editVisible = ref(false);
    const editForm = ref<Partial<Player>>({});
    const editSeason = ref({ active: true, guestPlayer: false });

    const isGuest = computed(() =>
        player.value
            ? isGuestInSeason(player.value, seasonStore.currentSeason)
            : false,
    );

    const playerAppearances = computed(() =>
        matchStore.appearances.filter((a) => a.playerId === playerId.value),
    );
    const totalGoals = computed(() =>
        playerAppearances.value.reduce((sum, a) => sum + (a.goals || 0), 0),
    );
    const totalAppearances = computed(
        () => playerAppearances.value.filter((a) => a.present).length,
    );
    const totalKeeper = computed(
        () => playerAppearances.value.filter((a) => a.isGoalkeeper).length,
    );
    const totalMatches = computed(() => matchStore.matches.length);
    const totalWashes = computed(
        () =>
            matchStore.matches.filter((m) => m.washing === playerId.value)
                .length,
    );
    const goalsPerMatch = computed(() =>
        totalAppearances.value > 0
            ? (totalGoals.value / totalAppearances.value).toFixed(2)
            : '0.00',
    );
    const attendancePercentage = computed(() =>
        totalMatches.value > 0
            ? Math.round((totalAppearances.value / totalMatches.value) * 100)
            : 0,
    );

    const animatedBarWidth = ref(0);
    watch(
        [loading, attendancePercentage],
        ([isLoading, pct]) => {
            if (!isLoading) {
                setTimeout(() => {
                    animatedBarWidth.value = pct as number;
                }, 80);
            } else {
                animatedBarWidth.value = 0;
            }
        },
        { immediate: true },
    );

    const goalsChartData = computed(() =>
        matchStore.appearances
            .filter((a) => a.playerId === playerId.value && a.present)
            .map((a) => {
                const match = matchStore.matches.find(
                    (m) => m.id === a.matchId,
                );
                if (!match) return null;
                return {
                    goals: a.goals || 0,
                    opponent: match.opponent,
                    dateSeconds: match.date?.seconds ?? 0,
                };
            })
            .filter(
                (
                    item,
                ): item is {
                    goals: number;
                    opponent: string;
                    dateSeconds: number;
                } => item !== null,
            )
            .sort((a, b) => a.dateSeconds - b.dateSeconds)
            .map(({ goals, opponent }) => ({ goals, opponent })),
    );

    const openEditDialog = () => {
        if (player.value) {
            const { seasons, ...identity } = player.value;
            void seasons;
            editForm.value = { ...identity };
            const info = playerSeasonInfo(
                player.value,
                seasonStore.currentSeason,
            );
            editSeason.value = {
                active: info?.active ?? true,
                guestPlayer: info?.guestPlayer ?? false,
            };
            editVisible.value = true;
        }
    };

    const savePlayer = async () => {
        if (!player.value) return;
        const seasonId = seasonStore.currentSeason;
        const seasonInfo = { ...editSeason.value };
        await playerStore.updatePlayer(player.value.id, editForm.value);
        await playerStore.setPlayerSeasonStatus(
            player.value.id,
            seasonId,
            seasonInfo,
        );
        player.value = {
            ...player.value,
            ...editForm.value,
            seasons: { ...player.value.seasons, [seasonId]: seasonInfo },
        } as Player;
        editVisible.value = false;
        toast.add({
            severity: 'success',
            summary: t('common.messages.success'),
            detail: t('player.messages.playerEditted'),
            life: TOAST_LIFE,
        });
    };

    onMounted(async () => {
        const p = await playerStore.fetchPlayer(playerId.value);
        player.value = p ?? null;
        matchStore.fetchMatches(seasonStore.currentSeason);
        matchStore.fetchAppearances(seasonStore.currentSeason);
        loading.value = false;
    });

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => {
            matchStore.fetchMatches(seasonId);
            matchStore.fetchAppearances(seasonId);
        },
    );
</script>

<template>
    <AppBreadcrumb :label="player?.name" />

    <!-- Hero banner -->
    <div
        class="shadow-hero relative mb-6 overflow-hidden rounded-2xl [background:var(--gradient-brand)]"
    >
        <div
            class="pointer-events-none absolute inset-0 [background:repeating-linear-gradient(-55deg,transparent,transparent_20px,rgba(255,255,255,0.015)_20px,rgba(255,255,255,0.015)_40px)]"
            aria-hidden="true"
        />

        <div class="relative z-10 flex flex-wrap items-center gap-5 p-6">
            <div
                class="flex size-18 shrink-0 items-center justify-center rounded-full border-[3px] border-white/25 bg-white/12 text-3xl font-black text-white"
            >
                <span v-if="player">
                    {{ player.name.charAt(0).toUpperCase() }}
                </span>
                <i v-else class="pi pi-user" />
            </div>

            <div class="min-w-0 flex-1">
                <Skeleton
                    v-if="loading || !player"
                    class="mb-2"
                    height="36px"
                    width="180px"
                />
                <h1
                    v-else
                    class="mb-0 truncate text-3xl font-black text-white lg:text-4xl"
                >
                    {{ player.name }}
                </h1>
                <span
                    v-if="!loading && isGuest"
                    class="text-xxs tracking-badge mt-1 inline-block rounded-full border border-white/25 bg-white/12 px-2 py-0.5 font-bold text-white/75 uppercase"
                >
                    {{ $t('player.guestPlayer') }}
                </span>
            </div>

            <button
                v-if="player && AuthStore.user?.id"
                class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/30 bg-white/12 px-2 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:border-white/50 hover:bg-white/22 sm:px-4"
                @click="openEditDialog"
            >
                <i class="pi pi-pencil" />
                <span class="hidden sm:inline-block">
                    {{ $t('common.edit') }}
                </span>
            </button>
        </div>
    </div>

    <!-- Stat tiles -->
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <PlayerStatTile
            icon="pi-trophy"
            gradient="var(--gradient-accent-amber)"
            :label="$t('player.totalGoals')"
            :loading="loading"
        >
            <div class="text-primary-900 text-4xl leading-none font-black">
                {{ totalGoals }}
            </div>
        </PlayerStatTile>

        <PlayerStatTile
            icon="pi-calendar"
            gradient="var(--gradient-accent-blue)"
            :label="$t('player.totalAppearances')"
            :loading="loading"
            skeleton-width="80px"
        >
            <div class="text-primary-900 text-4xl leading-none font-black">
                {{ totalAppearances
                }}<span class="text-primary-300 text-lg font-medium"
                    >/{{ totalMatches }}</span
                >
            </div>
        </PlayerStatTile>

        <PlayerStatTile
            icon="pi-shield"
            gradient="var(--gradient-accent-teal)"
            :label="$t('player.totalKeeper')"
            :loading="loading"
        >
            <div class="text-primary-900 text-4xl leading-none font-black">
                {{ totalKeeper }}
            </div>
        </PlayerStatTile>

        <PlayerStatTile
            icon="pi-chart-line"
            gradient="var(--gradient-accent-purple)"
            :label="$t('common.goalsPerMatch')"
            :loading="loading"
            skeleton-width="72px"
        >
            <div class="text-primary-900 text-4xl leading-none font-black">
                {{ goalsPerMatch }}
            </div>
        </PlayerStatTile>

        <PlayerStatTile
            icon="pi-sparkles"
            gradient="var(--gradient-accent-red)"
            :label="$t('washing.totalWashes')"
            :loading="loading"
        >
            <div class="text-primary-900 text-4xl leading-none font-black">
                {{ totalWashes }}
            </div>
        </PlayerStatTile>

        <PlayerStatTile
            icon="pi-check-circle"
            gradient="var(--gradient-accent-green)"
            :label="$t('common.attendancePercentage')"
            :loading="loading"
        >
            <div class="text-primary-900 text-4xl leading-none font-black">
                {{ attendancePercentage }}
                <span class="text-primary-300 text-lg font-medium">%</span>
            </div>
            <template #extra>
                <div
                    class="bg-primary-700/10 mt-2 h-1 overflow-hidden rounded-full"
                >
                    <div
                        class="h-full rounded-full bg-gradient-to-r from-green-500 to-green-700 transition-[width] duration-900 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]"
                        aria-hidden="true"
                        :style="{ width: `${animatedBarWidth}%` }"
                    />
                </div>
            </template>
        </PlayerStatTile>
    </div>

    <!-- Info + chart -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card v-if="AuthStore.user?.id">
            <template #title>
                <h2>{{ $t('player.playerInfo') }}</h2>
            </template>
            <template #content>
                <Skeleton v-if="loading" height="120px" />
                <ul v-else class="m-0 flex list-none flex-col gap-2.5 p-0">
                    <PlayerInfoRow
                        icon="pi pi-tag"
                        gradient="var(--gradient-accent-blue)"
                        :label="$t('common.clothingSize')"
                        :value="player?.clothingSize ?? '-'"
                    />
                    <PlayerInfoRow
                        icon="pi pi-user"
                        gradient="var(--gradient-accent-amber)"
                        :label="$t('common.hasJacket')"
                        :value="
                            player?.hasJacket
                                ? $t('common.yes')
                                : $t('common.no')
                        "
                        :value-class="
                            player?.hasJacket
                                ? 'text-green-700'
                                : 'text-red-700'
                        "
                    />
                    <PlayerInfoRow
                        icon="pi pi-briefcase"
                        gradient="var(--gradient-accent-teal)"
                        :label="$t('common.hasBag')"
                        :value="
                            player?.hasBag ? $t('common.yes') : $t('common.no')
                        "
                        :value-class="
                            player?.hasBag ? 'text-green-700' : 'text-red-700'
                        "
                    />
                    <PlayerInfoRow
                        icon="pi pi-users"
                        gradient="var(--gradient-accent-purple)"
                        :label="$t('player.guestPlayer')"
                        :value="isGuest ? $t('common.yes') : $t('common.no')"
                        :value-class="
                            isGuest ? 'text-green-700' : 'text-red-700'
                        "
                    />
                </ul>
            </template>
        </Card>

        <Card class="lg:col-span-2">
            <template #title>
                <h2>{{ $t('player.goalsTimeline') }}</h2>
            </template>
            <template #content>
                <Skeleton v-if="loading" height="160px" />
                <PlayerGoalsChart v-else :data="goalsChartData" />
            </template>
        </Card>
    </div>

    <!-- Edit dialog -->
    <Dialog
        v-if="AuthStore.user?.id"
        v-model:visible="editVisible"
        class="w-[400px]"
        modal
        :header="t('player.editPlayer')"
        :draggable="false"
    >
        <div class="flex flex-col gap-4">
            <div>
                <label for="name">{{ $t('common.name') }}</label>
                <InputText v-model="editForm.name" fluid input-id="name" />
            </div>
            <div>
                <label for="clothingSize">{{
                    $t('common.clothingSize')
                }}</label>
                <Select
                    v-model="editForm.clothingSize"
                    :options="['164', '158', '152', '146', '140', '134', '128']"
                    :placeholder="$t('common.clothingSize')"
                    input-id="clothingSize"
                    fluid
                />
            </div>
            <div class="flex items-center gap-2">
                <Checkbox
                    v-model="editForm.hasJacket"
                    binary
                    input-id="hasJacket"
                />
                <label for="hasJacket">
                    {{ $t('common.hasJacket') }}
                </label>
            </div>
            <div class="flex items-center gap-2">
                <Checkbox v-model="editForm.hasBag" binary input-id="hasBag" />
                <label for="hasBag">
                    {{ $t('common.hasBag') }}
                </label>
            </div>

            <div
                class="mt-1 flex flex-col gap-3 rounded-lg border border-gray-200 p-3"
            >
                <p
                    class="text-xs font-bold tracking-wide text-gray-500 uppercase"
                >
                    {{ seasonStore.currentSeason }}
                </p>
                <div class="flex items-center gap-2">
                    <Checkbox
                        v-model="editSeason.active"
                        binary
                        input-id="seasonActive"
                    />
                    <label for="seasonActive">
                        {{ $t('player.activeThisSeason') }}
                    </label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox
                        v-model="editSeason.guestPlayer"
                        binary
                        input-id="guestPlayer"
                    />
                    <label for="guestPlayer">
                        {{ $t('player.guestPlayer') }}
                    </label>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex w-full justify-between">
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    text
                    @click="editVisible = false"
                />
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    @click="savePlayer"
                />
            </div>
        </template>
    </Dialog>
</template>
