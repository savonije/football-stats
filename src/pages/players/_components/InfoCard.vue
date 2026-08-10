<script setup lang="ts">
    import { computed } from 'vue';
    import { Card, Skeleton } from 'primevue';

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
    <Card v-if="authStore.user?.id">
        <template #title>
            <h2>{{ $t('player.playerInfo') }}</h2>
        </template>
        <template #content>
            <Skeleton v-if="loading" height="120px" />
            <ul v-else class="m-0 flex list-none flex-col gap-2.5 p-0">
                <InfoRow
                    icon="pi pi-tag"
                    gradient="var(--gradient-accent-blue)"
                    :label="$t('common.clothingSize')"
                    :value="player?.clothingSize ?? '-'"
                />
                <InfoRow
                    icon="pi pi-user"
                    gradient="var(--gradient-accent-amber)"
                    :label="$t('common.hasJacket')"
                    :value="
                        player?.hasJacket ? $t('common.yes') : $t('common.no')
                    "
                    :value-class="
                        player?.hasJacket ? 'text-green-700' : 'text-red-700'
                    "
                />
                <InfoRow
                    icon="pi pi-briefcase"
                    gradient="var(--gradient-accent-teal)"
                    :label="$t('common.hasBag')"
                    :value="player?.hasBag ? $t('common.yes') : $t('common.no')"
                    :value-class="
                        player?.hasBag ? 'text-green-700' : 'text-red-700'
                    "
                />
                <InfoRow
                    icon="pi pi-users"
                    gradient="var(--gradient-accent-purple)"
                    :label="$t('player.guestPlayer')"
                    :value="isGuest ? $t('common.yes') : $t('common.no')"
                    :value-class="isGuest ? 'text-green-700' : 'text-red-700'"
                />
            </ul>
        </template>
    </Card>
</template>
