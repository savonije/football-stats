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
    import { useI18n } from 'vue-i18n';
    import PlayerGoalsChart from '@/components/PlayerGoalsChart.vue';
    import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
    import PlayerInfoRow from '@/components/PlayerInfoRow.vue';

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
            editForm.value = { ...player.value };
            editVisible.value = true;
        }
    };

    const savePlayer = async () => {
        if (!player.value) return;
        await playerStore.updatePlayer(player.value.id, editForm.value);
        player.value = { ...player.value, ...editForm.value } as Player;
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
        class="relative mb-6 overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(17,26,54,0.3)] [background:linear-gradient(135deg,#111a36_0%,#1d2e5d_30%,#27428a_60%,#2f529f_80%,#4067b9_100%)]"
    >
        <div
            class="pointer-events-none absolute inset-0 [background:repeating-linear-gradient(-55deg,transparent,transparent_20px,rgba(255,255,255,0.015)_20px,rgba(255,255,255,0.015)_40px)]"
        />
        <div class="relative z-10 flex flex-wrap items-center gap-5 p-6">
            <div
                class="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-[3px] border-white/25 bg-white/12 text-[1.75rem] font-black text-white"
            >
                <span v-if="player">{{
                    player.name.charAt(0).toUpperCase()
                }}</span>
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
                    v-if="!loading && player?.guestPlayer"
                    class="mt-1 inline-block rounded-full border border-white/25 bg-white/12 px-2 py-0.5 text-[0.65rem] font-bold tracking-[0.08em] text-white/75 uppercase"
                >
                    {{ $t('player.guestPlayer') }}
                </span>
            </div>

            <button
                v-if="player && AuthStore.user?.id"
                class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/30 bg-white/12 px-4 py-2 text-sm font-semibold text-white transition-[background,border-color] duration-[180ms] ease-in-out hover:border-white/50 hover:bg-white/22"
                @click="openEditDialog"
            >
                <i class="pi pi-pencil" />
                {{ $t('common.edit') }}
            </button>
        </div>
    </div>

    <!-- Stat tiles -->
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div
            class="flex flex-col gap-1 rounded-[14px] bg-white p-5 shadow-[0_2px_12px_rgba(39,66,138,0.08)] transition-[box-shadow,transform] duration-[220ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(39,66,138,0.18)]"
        >
            <div
                class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-base text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] [background:linear-gradient(135deg,#f59e0b,#b45309)]"
            >
                <i class="pi pi-trophy" />
            </div>
            <Skeleton v-if="loading" class="my-1" height="44px" width="56px" />
            <div
                v-else
                class="text-[2.25rem] leading-none font-black text-[#1d2e5d]"
            >
                {{ totalGoals }}
            </div>
            <div
                class="mt-1.5 text-[0.7rem] font-bold tracking-[0.06em] text-[#6285d1] uppercase"
            >
                {{ $t('player.totalGoals') }}
            </div>
        </div>

        <div
            class="flex flex-col gap-1 rounded-[14px] bg-white p-5 shadow-[0_2px_12px_rgba(39,66,138,0.08)] transition-[box-shadow,transform] duration-[220ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(39,66,138,0.18)]"
        >
            <div
                class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-base text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] [background:linear-gradient(135deg,#3b82f6,#1d4ed8)]"
            >
                <i class="pi pi-calendar" />
            </div>
            <Skeleton v-if="loading" class="my-1" height="44px" width="80px" />
            <div
                v-else
                class="text-[2.25rem] leading-none font-black text-[#1d2e5d]"
            >
                {{ totalAppearances
                }}<span class="text-[1.1rem] font-medium text-[#8da7df]"
                    >/{{ totalMatches }}</span
                >
            </div>
            <div
                class="mt-1.5 text-[0.7rem] font-bold tracking-[0.06em] text-[#6285d1] uppercase"
            >
                {{ $t('player.totalAppearances') }}
            </div>
        </div>

        <div
            class="flex flex-col gap-1 rounded-[14px] bg-white p-5 shadow-[0_2px_12px_rgba(39,66,138,0.08)] transition-[box-shadow,transform] duration-[220ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(39,66,138,0.18)]"
        >
            <div
                class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-base text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] [background:linear-gradient(135deg,#14b8a6,#0f766e)]"
            >
                <i class="pi pi-shield" />
            </div>
            <Skeleton v-if="loading" class="my-1" height="44px" width="56px" />
            <div
                v-else
                class="text-[2.25rem] leading-none font-black text-[#1d2e5d]"
            >
                {{ totalKeeper }}
            </div>
            <div
                class="mt-1.5 text-[0.7rem] font-bold tracking-[0.06em] text-[#6285d1] uppercase"
            >
                {{ $t('player.totalKeeper') }}
            </div>
        </div>

        <div
            class="flex flex-col gap-1 rounded-[14px] bg-white p-5 shadow-[0_2px_12px_rgba(39,66,138,0.08)] transition-[box-shadow,transform] duration-[220ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(39,66,138,0.18)]"
        >
            <div
                class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-base text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] [background:linear-gradient(135deg,#a855f7,#7e22ce)]"
            >
                <i class="pi pi-chart-line" />
            </div>
            <Skeleton v-if="loading" class="my-1" height="44px" width="72px" />
            <div
                v-else
                class="text-[2.25rem] leading-none font-black text-[#1d2e5d]"
            >
                {{ goalsPerMatch }}
            </div>
            <div
                class="mt-1.5 text-[0.7rem] font-bold tracking-[0.06em] text-[#6285d1] uppercase"
            >
                {{ $t('common.goalsPerMatch') }}
            </div>
        </div>

        <div
            class="col-span-2 flex flex-col gap-1 rounded-[14px] bg-white p-5 shadow-[0_2px_12px_rgba(39,66,138,0.08)] transition-[box-shadow,transform] duration-[220ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(39,66,138,0.18)] lg:col-span-1"
        >
            <div
                class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-base text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] [background:linear-gradient(135deg,#22c55e,#15803d)]"
            >
                <i class="pi pi-check-circle" />
            </div>
            <Skeleton v-if="loading" class="my-1" height="44px" width="56px" />
            <template v-else>
                <div
                    class="text-[2.25rem] leading-none font-black text-[#1d2e5d]"
                >
                    {{ attendancePercentage
                    }}<span class="text-[1.1rem] font-medium text-[#8da7df]"
                        >%</span
                    >
                </div>
                <div
                    class="mt-2 h-1 overflow-hidden rounded-full bg-[rgba(39,66,138,0.1)]"
                >
                    <div
                        class="h-full rounded-full bg-gradient-to-r from-green-500 to-green-700 transition-[width] duration-[900ms] [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]"
                        :style="{ width: `${animatedBarWidth}%` }"
                    />
                </div>
            </template>
            <div
                class="mt-1.5 text-[0.7rem] font-bold tracking-[0.06em] text-[#6285d1] uppercase"
            >
                {{ $t('common.attendancePercentage') }}
            </div>
        </div>
    </div>

    <!-- Info + chart -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
            <template #title>
                <h2>{{ $t('player.playerInfo') }}</h2>
            </template>
            <template #content>
                <Skeleton v-if="loading" height="120px" />
                <ul v-else class="m-0 flex list-none flex-col gap-2.5 p-0">
                    <PlayerInfoRow
                        icon="pi pi-tag"
                        gradient="linear-gradient(135deg, #3b82f6, #1d4ed8)"
                        :label="$t('common.clothingSize')"
                        :value="player?.clothingSize ?? '-'"
                    />
                    <PlayerInfoRow
                        icon="pi pi-user"
                        gradient="linear-gradient(135deg, #f59e0b, #b45309)"
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
                        gradient="linear-gradient(135deg, #14b8a6, #0f766e)"
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
                        gradient="linear-gradient(135deg, #a855f7, #7e22ce)"
                        :label="$t('player.guestPlayer')"
                        :value="
                            player?.guestPlayer
                                ? $t('common.yes')
                                : $t('common.no')
                        "
                        :value-class="
                            player?.guestPlayer
                                ? 'text-green-700'
                                : 'text-red-700'
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
        v-model:visible="editVisible"
        modal
        :header="t('player.editPlayer')"
        :style="{ width: '400px' }"
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
                <label for="hasJacket">{{ $t('common.hasJacket') }}</label>
            </div>
            <div class="flex items-center gap-2">
                <Checkbox v-model="editForm.hasBag" binary input-id="hasBag" />
                <label for="hasBag">{{ $t('common.hasBag') }}</label>
            </div>
            <div class="flex items-center gap-2">
                <Checkbox
                    v-model="editForm.guestPlayer"
                    binary
                    input-id="guestPlayer"
                />
                <label for="guestPlayer">{{ $t('player.guestPlayer') }}</label>
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
