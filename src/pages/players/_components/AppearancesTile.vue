<script setup lang="ts">
    import { computed } from 'vue';

    import Tile from '@/pages/players/_components/Tile.vue';
    import { usePlayerAppearances } from '@/composables/usePlayerAppearances';

    const { playerId, loading } = defineProps<{
        playerId: string;
        loading: boolean;
    }>();

    const { endedMatchIds, playerAppearances } = usePlayerAppearances(
        () => playerId,
    );

    const totalAppearances = computed(
        () => playerAppearances.value.filter((a) => a.present).length,
    );

    const totalMatches = computed(() => endedMatchIds.value.size);
</script>

<template>
    <Tile
        :label="$t('player.totalAppearances')"
        :loading="loading"
        skeleton-width="80px"
    >
        <div class="text-primary-900 text-4xl leading-none font-black">
            {{ totalAppearances
            }}<span class="text-primary-300 text-lg font-medium"
                >/{{ totalMatches }}</span
            >
        </div>
    </Tile>
</template>
