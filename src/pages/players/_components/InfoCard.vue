<script setup lang="ts">
    import { computed } from 'vue';

    import InfoRow from '@/pages/players/_components/InfoRow.vue';
    import { useStoreAuth } from '@/stores/authStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Player } from '@/types';
    import { isGuestInSeason } from '@/utils/playerSeason';

    const { player, loading } = defineProps<{
        player: Player | null;
        loading: boolean;
    }>();

    const authStore = useStoreAuth();
    const seasonStore = useSeasonStore();

    const isGuest = computed(() =>
        player ? isGuestInSeason(player, seasonStore.currentSeason) : false,
    );
</script>

<template>
    <UCard v-if="authStore.user?.id">
        <template #header>
            <h2>{{ $t('player.playerInfo') }}</h2>
        </template>

        <USkeleton v-if="loading" class="h-30 w-full" />
        <ul v-else class="m-0 flex list-none flex-col gap-2.5 p-0">
            <InfoRow
                gradient="var(--gradient-accent-blue)"
                icon="i-lucide-tag"
                :label="$t('common.clothingSize')"
                :value="player?.clothingSize ?? '-'"
            />
            <InfoRow
                gradient="var(--gradient-accent-amber)"
                icon="i-lucide-user"
                :label="$t('common.hasJacket')"
                :value="player?.hasJacket ? $t('common.yes') : $t('common.no')"
                :value-class="
                    player?.hasJacket ? 'text-green-700' : 'text-red-700'
                "
            />
            <InfoRow
                gradient="var(--gradient-accent-teal)"
                icon="i-lucide-briefcase"
                :label="$t('common.hasBag')"
                :value="player?.hasBag ? $t('common.yes') : $t('common.no')"
                :value-class="
                    player?.hasBag ? 'text-green-700' : 'text-red-700'
                "
            />
            <InfoRow
                gradient="var(--gradient-accent-purple)"
                icon="i-lucide-users"
                :label="$t('player.guestPlayer')"
                :value="isGuest ? $t('common.yes') : $t('common.no')"
                :value-class="isGuest ? 'text-green-700' : 'text-red-700'"
            />
        </ul>
    </UCard>
</template>
