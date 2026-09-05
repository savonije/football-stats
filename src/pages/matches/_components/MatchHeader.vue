<script setup lang="ts">
    import dayjs from 'dayjs';
    import { computed } from 'vue';

    import { CLUBNAME } from '@/constants';
    import MatchActionsMenu from '@/pages/matches/_components/MatchActionsMenu.vue';
    import type { Match } from '@/types';

    const { match } = defineProps<{ match: Match }>();

    /** The home side is named first, which is what says home or away. */
    const title = computed(() =>
        match.home
            ? `${CLUBNAME} - ${match.opponent}`
            : `${match.opponent} - ${CLUBNAME}`,
    );
</script>

<template>
    <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
            <h1 class="text-primary mb-0 text-2xl sm:text-3xl">
                {{ title }}
            </h1>

            <div
                v-if="match.date"
                class="text-primary-400 mt-1.5 text-sm font-medium"
            >
                {{ dayjs(match.date.toDate()).format('D MMMM YYYY') }}
            </div>
        </div>

        <MatchActionsMenu :match="match" />
    </div>
</template>
