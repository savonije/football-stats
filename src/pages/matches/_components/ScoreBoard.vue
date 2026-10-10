<script setup lang="ts">
    import { useToast } from '@nuxt/ui/composables/useToast';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

    import { useCanEdit } from '@/composables/useCanEdit';
    import { useConfirmDialog } from '@/composables/useConfirmDialog';
    import { CLUBNAME } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Match, MatchGoal } from '@/types';
    import type { ScoreSide } from '@/utils/match';
    import { getMatchMinute, getScoreSides, isPlayed } from '@/utils/match';

    type GoalType = ScoreSide['type'];

    interface Side extends ScoreSide {
        addLabel: string;
        removeLabel: string;
    }

    const { match } = defineProps<{ match: Match }>();

    const canEdit = useCanEdit();
    const confirm = useConfirmDialog();
    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const toast = useToast();
    const { t } = useI18n();

    const modal = ref(false);
    const selectedPlayer = ref<string | null>(null);
    const pendingMinute = ref<number | null>(null);

    const players = computed(() => matchStore.presentPlayersWithNames);

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

    const goalDescription = (goal: MatchGoal) => {
        if (goal.side === 'against') return t('match.goalTypes.against');
        if (goal.ownGoal) return t('match.goalTypes.forOwnGoal');

        const player =
            goal.playerId && playerStore.getPlayerById(goal.playerId)?.name;
        return player
            ? t('match.goalTypes.forBy', { player })
            : t('match.goalTypes.for');
    };

    watch(
        () => [match.id, match.goals?.length ?? 0] as const,
        ([id, count], [previousId, previousCount]) => {
            const goal = match.goals?.at(-1);
            if (id !== previousId || count <= previousCount || !goal) return;

            toast.add({
                title:
                    goal.side === 'for'
                        ? t('match.goalTitleFor', { team: CLUBNAME })
                        : t('match.goalTitleAgainst', { team: match.opponent }),
                description: goalDescription(goal),
                color: goal.side === 'for' ? 'primary' : 'warning',
                duration: 10000,
            });
        },
    );

    const closeModal = () => {
        modal.value = false;
        selectedPlayer.value = null;
    };

    const updateGoals = async (type: GoalType, delta: 1 | -1) => {
        if (delta < 0) {
            if (
                type === 'for' &&
                goalsFor.value > 0 &&
                !(await confirm({
                    title: t('match.removeGoalFor'),
                    message: t('match.removeGoalForConfirm', {
                        team: CLUBNAME,
                    }),
                    confirmLabel: t('common.delete'),
                    confirmColor: 'error',
                }))
            )
                return;

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

        if (type === 'for') {
            pendingMinute.value = minute;
            modal.value = true;
            return;
        }

        await matchStore.logGoal(seasonStore.currentSeason, match.id, {
            side: 'against',
            minute,
        });
    };

    const saveGoal = async (
        scorer: Pick<MatchGoal, 'playerId' | 'ownGoal'>,
    ) => {
        await matchStore.logGoal(seasonStore.currentSeason, match.id, {
            side: 'for',
            minute: pendingMinute.value,
            ...scorer,
        });

        closeModal();
    };

    onMounted(() => {
        if (!playerStore.playersLoaded) {
            playerStore.fetchPlayers();
        }
    });
</script>

<template>
    <div class="flex flex-col justify-center p-5">
        <div
            class="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-x-3 gap-y-2"
        >
            <template v-for="(side, index) in sides" :key="side.type">
                <div
                    class="text-primary-800 row-start-1 text-center text-base leading-tight font-bold sm:text-lg"
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
                class="text-primary-400 col-span-full row-start-3 mt-2 text-sm"
            >
                {{ t('match.noScoreYet') }}
            </div>

            <UBadge
                v-else-if="match.ended"
                class="col-span-full row-start-3 mt-2"
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
                <div class="flex flex-col gap-3">
                    <UAlert
                        v-if="!players.length"
                        color="warning"
                        :description="t('match.noPlayersAdded')"
                        icon="i-lucide-triangle-alert"
                        variant="subtle"
                    />

                    <USelect
                        v-else
                        v-model="selectedPlayer"
                        class="w-full"
                        :items="players"
                        label-key="playerName"
                        :placeholder="t('player.selectPlayer')"
                        value-key="playerId"
                        data-testid="goal-scorer"
                    />

                    <UButton
                        class="self-start"
                        color="neutral"
                        :label="t('match.ownGoalByOpponent')"
                        variant="outline"
                        @click="saveGoal({ ownGoal: true })"
                    />
                </div>
            </template>

            <template #footer>
                <DialogFooter
                    :confirm-label="t('common.save')"
                    confirm-icon="i-lucide-check"
                    :disabled="!selectedPlayer"
                    @cancel="closeModal"
                    @confirm="saveGoal({ playerId: selectedPlayer! })"
                />
            </template>
        </UModal>
    </div>
</template>
