<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { CLUBNAME } from '@/constants';
    import { usePlayerStore } from '@/stores/playerStore';
    import type { MatchGoal } from '@/types';

    const { goal } = defineProps<{ goal?: MatchGoal }>();

    const playerStore = usePlayerStore();
    const { t } = useI18n();

    const open = ref(false);
    const showGoalWord = ref(false);
    let wordTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    const player = computed(
        () => goal?.playerId && playerStore.getPlayerById(goal.playerId)?.name,
    );

    const word = computed(() => {
        if (showGoalWord.value) return t('match.goalBanner.goal');
        if (goal?.ownGoal) return t('match.goalBanner.ownGoal');
        return player.value || CLUBNAME;
    });

    const description = computed(() => {
        if (goal?.ownGoal) return t('match.goalTypes.forOwnGoal');
        return player.value
            ? t('match.goalTypes.forBy', { player: player.value })
            : t('match.goalTypes.for');
    });

    watch(
        () => goal,
        () => {
            showGoalWord.value = true;
            open.value = true;

            clearTimeout(wordTimer);
            clearTimeout(closeTimer);
            wordTimer = setTimeout(() => (showGoalWord.value = false), 10000);
            closeTimer = setTimeout(() => (open.value = false), 20000);
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
                    'border-primary-700 animate-goal-flash flex h-19 items-center overflow-hidden border-y-2 transition-transform duration-500 ease-out motion-reduce:animate-none',
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
