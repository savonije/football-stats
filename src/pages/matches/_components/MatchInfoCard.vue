<script setup lang="ts">
    import MatchInfoRow from '@/components/match/MatchInfoRow.vue';

    import { useMatchInfoRows } from '@/composables/useMatchInfoRows';
    import type { Match } from '@/types';
    import { isPlayed } from '@/utils/match';

    const { match } = defineProps<{ match: Match }>();

    const rows = useMatchInfoRows(() => match);
</script>

<template>
    <details
        v-if="rows.length"
        class="group shadow-card mt-4 overflow-hidden rounded-xl bg-white"
        :open="!isPlayed(match)"
        data-testid="match-info"
    >
        <summary
            class="flex cursor-pointer list-none items-center gap-3.5 px-4 py-3.5 [&::-webkit-details-marker]:hidden"
        >
            <span
                class="bg-primary-50 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
            >
                <UIcon class="size-4.5" name="i-lucide-info" />
            </span>

            <span class="text-primary-900 flex-1 font-bold">
                {{ $t('match.practical') }}
            </span>

            <UIcon
                class="text-primary-600 size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                name="i-lucide-chevron-down"
            />
        </summary>

        <MatchInfoRow v-for="row in rows" :key="row.icon" :row />
    </details>
</template>
