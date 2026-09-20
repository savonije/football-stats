<script setup lang="ts">
    import { useToast } from '@nuxt/ui/composables/useToast';
    import { computed, onMounted, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useCanEdit } from '@/composables/useCanEdit';
    import { CLUBNAME } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Match } from '@/types';
    import type { ScoreSide } from '@/utils/match';
    import { getMatchMinute, getScoreSides, isPlayed } from '@/utils/match';

    type GoalType = ScoreSide['type'];

    const OPPONENT_OWN_GOAL = '__ownGoal__';

    interface Side extends ScoreSide {
        addLabel: string;
        removeLabel: string;
    }

    const { match } = defineProps<{ match: Match }>();

    const canEdit = useCanEdit();
    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const toast = useToast();
    const { t } = useI18n();

    const modal = ref(false);
    const selectedPlayer = ref<string | null>(null);
    const pendingMinute = ref<number | null>(null);

    const players = computed(() => matchStore.presentPlayersWithNames);

    const scorerOptions = computed(() => [
        ...players.value.map(({ playerId, playerName }) => ({
            playerId,
            playerName,
        })),
        {
            playerId: OPPONENT_OWN_GOAL,
            playerName: t('match.ownGoalByOpponent'),
        },
    ]);
    const played = computed(() => isPlayed(match));
    const editable = computed(() => canEdit.value && !match.ended);

    const goalsFor = computed(() => match.result?.goalsFor ?? 0);
    const goalsAgainst = computed(() => match.result?.goalsAgainst ?? 0);

    const sides = computed<Side[]>(() =>
        getScoreSides(match, CLUBNAME).map((side) => ({
            ...side,
            addLabel:
                side.type === 'for'
                    ? t('match.addGoalFor')
                    : t('match.addGoalAgainst'),
            removeLabel:
                side.type === 'for'
                    ? t('match.removeGoalFor')
                    : t('match.removeGoalAgainst'),
        })),
    );

    const scoreClass = (side: Side) => {
        if (!played.value) return 'text-primary-100';

        const other = side.type === 'for' ? goalsAgainst.value : goalsFor.value;
        return match.ended && side.goals < other
            ? 'text-primary-300'
            : 'text-primary-900';
    };

    const showGoalToast = (title: string, description: string) =>
        toast.add({
            title,
            description,
            color: 'info',
            duration: 10000,
        });

    const closeModal = () => {
        modal.value = false;
        selectedPlayer.value = null;
    };

    const updateGoals = async (type: GoalType, delta: 1 | -1) => {
        if (delta < 0) {
            await matchStore.removeLastGoal(
                seasonStore.currentSeason,
                match.id,
                type,
            );
            return;
        }

        const minute = getMatchMinute(
            match,
            seasonStore.currentHalfDuration,
            Date.now(),
        );

        await matchStore.scoreGoal(seasonStore.currentSeason, match.id, type);

        if (type === 'for') {
            pendingMinute.value = minute;
            modal.value = true;
            return;
        }

        await matchStore.logGoal(seasonStore.currentSeason, match.id, {
            side: 'against',
            minute,
        });

        showGoalToast(
            t('match.goalTitleAgainst', { team: match.opponent }),
            t('match.goalTypes.against'),
        );
    };

    const saveOpponentOwnGoal = async () => {
        await matchStore.logGoal(seasonStore.currentSeason, match.id, {
            side: 'for',
            minute: pendingMinute.value,
            ownGoal: true,
        });

        showGoalToast(
            t('match.goalTitleFor', { team: CLUBNAME }),
            t('match.goalTypes.forOwnGoal'),
        );

        closeModal();
    };

    const saveGoal = async () => {
        if (!selectedPlayer.value) return;

        if (selectedPlayer.value === OPPONENT_OWN_GOAL) {
            await saveOpponentOwnGoal();
            return;
        }

        await matchStore.logGoal(seasonStore.currentSeason, match.id, {
            side: 'for',
            minute: pendingMinute.value,
            playerId: selectedPlayer.value,
        });

        showGoalToast(
            t('match.goalTitleFor', { team: CLUBNAME }),
            t('match.goalTypes.forBy', {
                player: players.value.find(
                    (candidate) => candidate.playerId === selectedPlayer.value,
                )?.playerName,
            }),
        );

        closeModal();
    };

    onMounted(() => {
        if (!playerStore.playersLoaded) {
            playerStore.fetchPlayers();
        }
    });
</script>

<template>
    <div class="p-5">
        <div
            class="tracking-label text-primary-400 font-mono text-xs font-bold uppercase"
        >
            {{ match.ended ? t('match.finalScore') : t('match.standing') }}
        </div>

        <div
            class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-x-3 gap-y-2"
        >
            <template v-for="(side, index) in sides" :key="side.type">
                <div
                    class="tracking-label text-primary-300 row-start-1 text-center font-mono text-xs leading-tight font-bold uppercase"
                    :class="index === 0 ? 'col-start-1' : 'col-start-3'"
                >
                    {{ side.name }}
                </div>

                <div
                    class="row-start-2 text-5xl leading-none font-black tabular-nums sm:text-6xl"
                    :class="[
                        index === 0 ? 'col-start-1' : 'col-start-3',
                        scoreClass(side),
                    ]"
                    :data-testid="`score-${side.type}`"
                >
                    {{ played ? side.goals : 0 }}
                </div>

                <div
                    v-if="editable && played"
                    class="row-start-3 mt-1 flex items-center gap-2"
                    :class="index === 0 ? 'col-start-1' : 'col-start-3'"
                >
                    <UButton
                        class="border-primary-100 bg-primary-50 text-primary hover:bg-primary-100 size-11 justify-center rounded-full"
                        :aria-label="side.removeLabel"
                        color="neutral"
                        icon="i-lucide-minus"
                        variant="outline"
                        @click="updateGoals(side.type, -1)"
                    />

                    <UButton
                        class="border-primary-100 bg-primary-50 text-primary hover:bg-primary-100 size-11 justify-center rounded-full"
                        :aria-label="side.addLabel"
                        color="neutral"
                        icon="i-lucide-plus"
                        variant="outline"
                        @click="updateGoals(side.type, 1)"
                    />
                </div>
            </template>

            <div
                class="bg-primary-100 col-start-2 row-start-2 h-1 w-6 rounded-full"
            />

            <div
                v-if="!played"
                class="tracking-label text-primary-300 col-span-full row-start-3 mt-2 font-mono text-xs font-bold uppercase"
            >
                {{ t('match.noScoreYet') }}
            </div>

            <UBadge
                v-else-if="match.ended"
                class="tracking-badge text-xxs col-span-full row-start-3 mt-2 font-mono font-bold uppercase"
                color="primary"
                icon="i-lucide-flag"
                :label="t('match.isEnded')"
                variant="subtle"
            />
        </div>

        <UModal
            v-model:open="modal"
            :title="t('match.goalScorer')"
            :ui="{ content: 'w-md' }"
            @update:open="!$event && closeModal()"
        >
            <template #body>
                <UAlert
                    v-if="!scorerOptions.length"
                    color="warning"
                    :description="t('match.noPlayersAdded')"
                    icon="i-lucide-triangle-alert"
                    variant="subtle"
                />

                <USelect
                    v-else
                    v-model="selectedPlayer"
                    class="w-full"
                    :items="scorerOptions"
                    label-key="playerName"
                    :placeholder="t('player.selectPlayer')"
                    value-key="playerId"
                    data-testid="goal-scorer"
                />
            </template>

            <template #footer>
                <UButton
                    v-if="scorerOptions.length"
                    icon="i-lucide-check"
                    :label="t('common.save')"
                    @click="saveGoal"
                />
            </template>
        </UModal>
    </div>
</template>
