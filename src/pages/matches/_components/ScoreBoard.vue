<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
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

    const lost = (side: Side) =>
        match.ended &&
        side.goals <
            (side.type === 'for' ? goalsAgainst.value : goalsFor.value);

    const scoreClass = (side: Side) => {
        if (!played.value) return 'text-white/25';
        return lost(side) ? 'text-primary-300' : '';
    };

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
    <div>
        <div
            class="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-x-2 gap-y-2 text-center"
        >
            <template v-for="(side, index) in sides" :key="side.type">
                <div
                    class="row-start-1 self-end text-base leading-tight font-bold"
                    :class="[
                        index === 0 ? 'col-start-1' : 'col-start-3',
                        { 'text-primary-200': lost(side) },
                    ]"
                >
                    {{ side.name }}
                </div>

                <div
                    class="row-start-2 text-6xl leading-none font-black tabular-nums"
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
                        class="size-11 justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20"
                        :aria-label="side.removeLabel"
                        color="neutral"
                        icon="i-lucide-minus"
                        variant="ghost"
                        @click="updateGoals(side.type, -1)"
                    />

                    <UButton
                        class="size-11 justify-center rounded-full"
                        :class="
                            side.type === 'for'
                                ? 'bg-amber text-primary-950 hover:bg-amber-400'
                                : 'border border-white/30 bg-white/10 text-white hover:bg-white/20'
                        "
                        :aria-label="side.addLabel"
                        color="neutral"
                        icon="i-lucide-plus"
                        variant="ghost"
                        @click="updateGoals(side.type, 1)"
                    />
                </div>
            </template>

            <div class="col-start-2 row-start-2 px-1">
                <slot />
            </div>
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
