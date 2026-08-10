<script setup lang="ts">
    import { computed } from 'vue';

    import Tile from '@/pages/players/_components/Tile.vue';
    import { usePlayerAppearances } from '@/composables/usePlayerAppearances';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const { playerAppearances } = usePlayerAppearances(() => playerId);

    const totalGoals = computed(() =>
        playerAppearances.value.reduce((sum, a) => sum + (a.goals || 0), 0),
    );
</script>

<template>
    <Tile :label="$t('player.totalGoals')" :loading="loading">
        <div class="text-primary-900 text-4xl leading-none font-black">
            {{ totalGoals }}
        </div>
    </Tile>
</template>
