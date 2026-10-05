<script setup lang="ts">
    import dayjs from 'dayjs';
    import { computed } from 'vue';

    import MatchActionsMenu from '@/pages/matches/_components/MatchActionsMenu.vue';

    import { CLUBNAME } from '@/constants';
    import type { Match } from '@/types';
    import { hasKickoffTime } from '@/utils/date';

    const { match } = defineProps<{ match: Match }>();
    const emit = defineEmits<{ addPlayers: [] }>();

    const dateLabel = computed(() => {
        const date = match.date.toDate();
        return dayjs(date).format(
            hasKickoffTime(date) ? 'D MMMM YYYY, HH:mm' : 'D MMMM YYYY',
        );
    });

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
                {{ dateLabel }}
            </div>
        </div>

        <MatchActionsMenu :match="match" @add-players="emit('addPlayers')" />
    </div>
</template>
