<script setup lang="ts">
    import { useToast } from '@nuxt/ui/composables/useToast';
    import { computed, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { CLUBNAME } from '@/constants';
    import { usePlayerStore } from '@/stores/playerStore';
    import type { Match, MatchGoal } from '@/types';

    const { match } = defineProps<{ match: Match }>();

    const playerStore = usePlayerStore();
    const toast = useToast();
    const { t } = useI18n();

    const goal = ref<MatchGoal>();
    const open = ref(false);
    const showGoalWord = ref(false);
    let wordTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    const player = computed(
        () =>
            goal.value?.playerId &&
            playerStore.getPlayerById(goal.value.playerId)?.name,
    );

    const word = computed(() => {
        if (showGoalWord.value) return t('match.goalBanner.goal');
        if (goal.value?.ownGoal) return t('match.goalBanner.ownGoal');
        return player.value || CLUBNAME;
    });

    const description = computed(() => {
        if (goal.value?.ownGoal) return t('match.goalTypes.forOwnGoal');
        return player.value
            ? t('match.goalTypes.forBy', { player: player.value })
            : t('match.goalTypes.for');
    });

    const celebrate = (scored: MatchGoal) => {
        goal.value = scored;
        showGoalWord.value = true;
        open.value = true;

        clearTimeout(wordTimer);
        clearTimeout(closeTimer);
        wordTimer = setTimeout(() => (showGoalWord.value = false), 10000);
        closeTimer = setTimeout(() => (open.value = false), 20000);
    };

    watch(
        () => [match.id, match.goals?.length ?? 0] as const,
        ([id, count], [previousId, previousCount]) => {
            const scored = match.goals?.at(-1);
            if (id !== previousId || count <= previousCount || !scored) return;

            if (scored.side === 'for') {
                celebrate(scored);
                return;
            }

            toast.add({
                title: t('match.goalTitleAgainst', { team: match.opponent }),
                description: t('match.goalTypes.against'),
                color: 'warning',
                duration: 10000,
            });
        },
    );
</script>

<template>
    <div
        class="grid transition-all duration-500 ease-out motion-reduce:transition-none"
        :class="
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        "
        role="status"
        data-testid="goal-banner"
    >
        <div class="min-h-0 overflow-hidden">
            <span class="sr-only"> {{ open ? description : '' }}</span>

            <div
                :class="[
                    'border-primary-700 animate-goal-flash mt-4 flex h-19 items-center overflow-hidden rounded-xl border-2 transition-transform duration-500 ease-out motion-reduce:animate-none',
                    { '-translate-y-full': !open },
                ]"
                aria-hidden="true"
            >
                <div
                    class="animate-marquee flex w-max motion-reduce:animate-none"
                >
                    <div
                        v-for="index in 8"
                        :key="`${index}-${word}`"
                        class="flex items-center gap-8 pr-8"
                    >
                        <span
                            class="pe-1 text-4xl leading-none font-black uppercase italic [text-box:trim-both_cap_alphabetic] motion-reduce:animate-none"
                            :class="
                                showGoalWord
                                    ? 'animate-goal-word'
                                    : 'animate-goal-pop'
                            "
                        >
                            {{ word }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
