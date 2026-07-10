<script setup lang="ts">
    import { computed } from 'vue';
    import dayjs from 'dayjs';
    import type { Match } from '@/types';
    import ScoreBox from '@/components/ScoreBox.vue';
    import { CLUBNAME } from '@/constants';
    import { hasStarted } from '@/utils/match';

    const props = defineProps<{ match: Match | null }>();
    const homeClass = computed(() =>
        props.match?.home ? 'flex-row' : 'flex-row-reverse',
    );
</script>

<template>
    <div v-if="props.match">
        <h1
            class="text-primary mb-0 flex inline-flex items-center gap-2 text-xl sm:text-3xl"
            :class="homeClass"
        >
            <span>{{ CLUBNAME }}</span>
            <span> - </span>
            <span>{{ props.match?.opponent }}</span>
        </h1>

        <div v-if="props.match?.date" class="text-sm text-gray-600">
            {{ dayjs(props.match.date.toDate()).format('D MMMM YYYY') }}
        </div>

        <div
            v-if="hasStarted(props.match)"
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
