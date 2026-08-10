<script setup lang="ts">
    import { computed } from 'vue';

    import Tile from '@/pages/players/_components/Tile.vue';
    import { usePlayerAppearances } from '@/composables/usePlayerAppearances';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const { playerAppearances } = usePlayerAppearances(() => playerId);

    // Averaged over the matches the player actually attended, not over every
    // match of the season.
    const goalsPerMatch = computed(() => {
        const attended = playerAppearances.value.filter(
            (a) => a.present,
        ).length;
        if (attended === 0) return '0.00';

        const goals = playerAppearances.value.reduce(
            (sum, a) => sum + (a.goals || 0),
            0,
        );
        return (goals / attended).toFixed(2);
    });
</script>

<template>
    <Tile
        :label="$t('common.goalsPerMatch')"
        :loading="loading"
        skeleton-width="72px"
    >
        <div class="text-primary-900 text-4xl leading-none font-black">
            {{ goalsPerMatch }}
        </div>
    </Tile>
</template>
