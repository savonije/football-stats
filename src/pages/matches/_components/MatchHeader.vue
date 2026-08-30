<script setup lang="ts">
    import { computed } from 'vue';
    import dayjs from 'dayjs';

    import MatchActionsMenu from '@/pages/matches/_components/MatchActionsMenu.vue';
    import ScoreBox from '@/pages/matches/_components/ScoreBox.vue';
    import { CLUBNAME } from '@/constants';
    import type { Match } from '@/types';
    import { isPlayed } from '@/utils/match';

    const props = defineProps<{ match: Match | null }>();

    const homeClass = computed(() =>
        props.match?.home ? 'flex-row' : 'flex-row-reverse',
    );
</script>

<template>
    <div v-if="props.match">
        <div class="flex items-center justify-between gap-2">
            <h1
                class="text-primary mb-0 flex inline-flex items-center gap-2 text-xl sm:text-3xl"
                :class="homeClass"
            >
                <span>{{ CLUBNAME }}</span>
                <span> - </span>
                <span>{{ props.match?.opponent }}</span>
            </h1>

            <MatchActionsMenu :match="props.match" />
        </div>

        <div v-if="props.match?.date" class="text-sm text-gray-600">
            {{ dayjs(props.match.date.toDate()).format('D MMMM YYYY') }}
        </div>

        <div
            v-if="isPlayed(props.match)"
            class="my-12 flex items-center justify-center gap-3"
            :class="homeClass"
        >
            <ScoreBox
                :match="props.match"
                type="for"
                :reversed="props.match?.home"
            />

            <div class="text-2xl font-bold">-</div>

            <ScoreBox
                :match="props.match"
                type="against"
                :reversed="!props.match?.home"
            />
        </div>
    </div>
</template>
