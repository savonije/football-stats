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
    import { isPlayed } from '@/utils/match';

    type GoalType = 'for' | 'against';

    interface Side {
        type: GoalType;
        name: string;
        goals: number;
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

    const players = computed(() => matchStore.presentPlayersWithNames);
    const played = computed(() => isPlayed(match));
    const editable = computed(() => canEdit.value && !match.ended);

    const goalsFor = computed(() => match.result?.goalsFor ?? 0);
    const goalsAgainst = computed(() => match.result?.goalsAgainst ?? 0);

    const club = computed<Side>(() => ({
        type: 'for',
        name: CLUBNAME,
        goals: goalsFor.value,
        addLabel: t('match.addGoalFor'),
        removeLabel: t('match.removeGoalFor'),
    }));

    const opponent = computed<Side>(() => ({
        type: 'against',
        name: match.opponent,
        goals: goalsAgainst.value,
        addLabel: t('match.addGoalAgainst'),
        removeLabel: t('match.removeGoalAgainst'),
    }));

    /** The home side comes first — that ordering is what says home or away. */
    const sides = computed(() =>
        match.home
            ? [club.value, opponent.value]
            : [opponent.value, club.value],
    );

    const scoreClass = (side: Side) => {
        if (!played.value) return 'text-primary-100';

        const other = side.type === 'for' ? goalsAgainst.value : goalsFor.value;
        return match.ended && side.goals < other
            ? 'text-primary-300'
            : 'text-primary-900';
    };

    const updateGoals = async (type: GoalType, delta: 1 | -1) => {
        const current = type === 'for' ? goalsFor.value : goalsAgainst.value;
        const goals = current + delta;

        if (goals < 0) return;

        await matchStore.updateMatchGoals(
            seasonStore.currentSeason,
            match.id,
            type,
            goals,
        );

        if (delta < 0) return;

        if (type === 'for') modal.value = true;

        toast.add({
            title: t('common.goal'),
            description: t(`match.goalTypes.${type}`),
            color: 'info',
            duration: 20000,
        });
    };

    const saveGoal = async () => {
        if (!selectedPlayer.value) return;

        const appearance = matchStore.appearances.find(
            (player) =>
                player.present && player.playerId === selectedPlayer.value,
        );

        if (!appearance) return;

        await matchStore.incrementPlayerGoals(
            seasonStore.currentSeason,
            match.id,
            appearance.id,
            1,
        );

        modal.value = false;
        selectedPlayer.value = null;
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
            class="tracking-label text-primary-400 text-xs font-bold uppercase"
        >
            {{ match.ended ? t('match.finalScore') : t('match.standing') }}
        </div>

        <div
            class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-x-3 gap-y-2"
        >
            <template v-for="(side, index) in sides" :key="side.type">
                <div
                    class="tracking-label text-primary-300 row-start-1 text-center text-xs leading-tight font-bold uppercase"
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
                class="tracking-label text-primary-300 col-span-full row-start-3 mt-2 text-xs font-bold uppercase"
            >
                {{ t('match.noScoreYet') }}
            </div>

            <UBadge
                v-else-if="match.ended"
                class="tracking-badge text-xxs col-span-full row-start-3 mt-2 font-bold uppercase"
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
        >
            <template #body>
                <USelect
                    v-model="selectedPlayer"
                    class="w-full"
                    :items="players"
                    label-key="playerName"
                    :placeholder="t('player.selectPlayer')"
                    value-key="playerId"
                />
            </template>

            <template #footer>
                <UButton
                    icon="i-lucide-check"
                    :label="t('common.save')"
                    @click="saveGoal"
                />
            </template>
        </UModal>
    </div>
</template>
