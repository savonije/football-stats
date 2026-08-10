<script setup lang="ts">
    import { computed } from 'vue';

    import Tile from '@/pages/players/_components/Tile.vue';
    import StatProgressBar from '@/pages/players/_components/StatProgressBar.vue';
    import { usePlayerAppearances } from '@/composables/usePlayerAppearances';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const { endedMatchIds, playerAppearances } = usePlayerAppearances(
        () => playerId,
    );

    const attendancePercentage = computed(() => {
        const totalMatches = endedMatchIds.value.size;
        if (totalMatches === 0) return 0;

        const attended = playerAppearances.value.filter(
            (a) => a.present,
        ).length;
        return Math.round((attended / totalMatches) * 100);
    });
</script>

<template>
    <Tile :label="$t('common.attendancePercentage')" :loading="loading">
        <div class="text-primary-900 text-4xl leading-none font-black">
            {{ attendancePercentage }}
            <span class="text-primary-300 text-lg font-medium">%</span>
        </div>
        <template #extra>
            <StatProgressBar :percentage="attendancePercentage" color="green" />
        </template>
    </Tile>
</template>
