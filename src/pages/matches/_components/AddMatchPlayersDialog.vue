<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';

    const { seasonId, matchId } = defineProps<{
        seasonId: string;
        matchId: string;
    }>();

    const visible = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useAppToast();
    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();

    const loading = ref(false);
    const selectedPlayerIds = ref<string[]>([]);

    const appearanceFor = (playerId: string) =>
        matchStore.appearances.find(
            (appearance) => appearance.playerId === playerId,
        );

    const availablePlayers = computed(() =>
        playerStore
            .playersInSeason(seasonId)
            .filter((player) => !appearanceFor(player.id)?.present)
            .map((player) => ({ label: player.name, value: player.id })),
    );

    const closeDialog = () => (visible.value = false);

    const submit = async () => {
        if (!selectedPlayerIds.value.length) {
            toast.warn(t('common.validation.fillAll'));
            return;
        }

        const count = selectedPlayerIds.value.length;
        loading.value = true;

        try {
            await Promise.all(
                selectedPlayerIds.value.map((playerId) => {
                    const existing = appearanceFor(playerId);

                    if (existing) {
                        return matchStore.updateAppearance(
                            seasonId,
                            matchId,
                            existing.id,
                            { present: true },
                        );
                    }

                    return matchStore.addAppearance(seasonId, matchId, {
                        id: crypto.randomUUID(),
                        playerId,
                        present: true,
                        goals: 0,
                        isGoalkeeper: false,
                        seasonId,
                        matchId,
                    });
                }),
            );

            toast.success(t('match.messages.playersAdded', count));
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.error(t('match.messages.playersAddError'));
        } finally {
            loading.value = false;
        }
    };

    onMounted(() => {
        if (!playerStore.playersLoaded) playerStore.fetchPlayers();
    });

    watch(visible, (isVisible) => {
        if (!isVisible) selectedPlayerIds.value = [];
    });
</script>

<template>
    <UModal
        v-model:open="visible"
        :title="t('match.addPlayers')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <p v-if="!availablePlayers.length" class="text-sm text-gray-600">
                {{ $t('match.allPlayersInMatch') }}
            </p>

            <div v-else>
                <label for="matchPlayers">
                    {{ $t('player.player', 2) }}
                    <small>({{ $t('common.required') }})</small>
                </label>
                <USelectMenu
                    id="matchPlayers"
                    v-model="selectedPlayerIds"
                    class="w-full"
                    :items="availablePlayers"
                    multiple
                    :placeholder="$t('player.selectPlayers')"
                    value-key="value"
                    data-testid="match-players"
                />
            </div>
        </template>

        <template #footer>
            <div class="flex w-full justify-between">
                <UButton
                    color="neutral"
                    :label="$t('common.cancel')"
                    variant="ghost"
                    @click="closeDialog"
                />
                <UButton
                    :disabled="!availablePlayers.length"
                    icon="i-lucide-check"
                    :label="$t('common.add')"
                    :loading="loading"
                    @click="submit"
                />
            </div>
        </template>
    </UModal>
</template>
