<script setup lang="ts">
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { usePlayerStore } from '@/stores/playerStore';
    import type { Match } from '@/types';

    const { match } = defineProps<{ match: Match }>();

    const playerStore = usePlayerStore();
    const { t } = useI18n();

    const goals = computed(() =>
        (match.goals ?? []).map((goal, index) => ({
            ...goal,
            index,
            scorer:
                goal.side === 'for'
                    ? (goal.playerId &&
                          playerStore.getPlayerById(goal.playerId)?.name) ||
                      t('match.unknownScorer')
                    : match.opponent,
        })),
    );
</script>

<template>
    <div v-if="goals.length" class="shadow-card mt-4 rounded-xl bg-white p-5">
        <div
            class="tracking-label text-primary-400 font-mono text-xs font-bold uppercase"
        >
            {{ t('common.goal', 2) }}
        </div>

        <ol class="mt-3 space-y-2" data-testid="goal-timeline">
            <li
                v-for="goal in goals"
                :key="goal.index"
                class="flex items-center gap-3"
                data-testid="goal-timeline-item"
            >
                <span
                    class="text-primary-400 w-8 shrink-0 text-right font-mono text-sm font-bold tabular-nums"
                >
                    {{ goal.minute ? `${goal.minute}'` : '—' }}
                </span>

                <UIcon
                    class="size-4 shrink-0"
                    :class="
                        goal.side === 'for' ? 'text-amber' : 'text-primary-200'
                    "
                    name="i-lucide-volleyball"
                />

                <span
                    class="truncate text-sm"
                    :class="
                        goal.side === 'for'
                            ? 'text-primary-900 font-medium'
                            : 'text-primary-400'
                    "
                >
                    {{ goal.ownGoal ? t('match.ownGoal') : goal.scorer }}
                </span>
            </li>
        </ol>
    </div>
</template>
