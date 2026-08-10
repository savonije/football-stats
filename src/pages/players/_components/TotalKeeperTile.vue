<script setup lang="ts">
    import { computed } from 'vue';

    import Tile from '@/pages/players/_components/Tile.vue';
    import { usePlayerAppearances } from '@/composables/usePlayerAppearances';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const { playerAppearances } = usePlayerAppearances(() => playerId);

    const totalKeeper = computed(
        () => playerAppearances.value.filter((a) => a.isGoalkeeper).length,
    );
</script>

<template>
    <Tile :label="$t('player.totalKeeper')" :loading="loading">
        <div class="text-primary-900 text-4xl leading-none font-black">
            {{ totalKeeper }}
        </div>
    </Tile>
</template>
