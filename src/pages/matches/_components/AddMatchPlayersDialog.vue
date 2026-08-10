<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { Button, Dialog, MultiSelect } from 'primevue';
    import { useToast } from 'primevue/usetoast';
    import { useI18n } from 'vue-i18n';

    import { TOAST_LIFE } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';

    const { seasonId, matchId } = defineProps<{
        seasonId: string;
        matchId: string;
    }>();

    const visible = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useToast();
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
            toast.add({
                severity: 'warn',
                summary: t('common.validation.warning'),
                detail: t('common.validation.fillAll'),
                life: TOAST_LIFE,
            });
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

            toast.add({
                severity: 'success',
                summary: t('common.messages.success'),
                detail: t('match.messages.playersAdded', count),
                life: TOAST_LIFE,
            });
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                detail: t('match.messages.playersAddError'),
                life: TOAST_LIFE,
            });
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
    <Dialog
        v-model:visible="visible"
        class="w-md"
        :header="t('match.addPlayers')"
        :draggable="false"
        modal
        dismissable-mask
    >
        <p v-if="!availablePlayers.length" class="text-sm text-gray-600">
            {{ $t('match.allPlayersInMatch') }}
        </p>

        <div v-else>
            <label for="matchPlayers">
                {{ $t('player.player', 2) }}
                <small>({{ $t('common.required') }})</small>
            </label>
            <MultiSelect
                v-model="selectedPlayerIds"
                :options="availablePlayers"
                :placeholder="$t('player.selectPlayers')"
                option-label="label"
                option-value="value"
                input-id="matchPlayers"
                filter
                show-clear
                fluid
            />
        </div>

        <template #footer>
            <div class="flex w-full justify-between">
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    text
                    @click="closeDialog"
                />
                <Button
                    :label="$t('common.add')"
                    icon="pi pi-check"
                    :loading="loading"
                    :disabled="!availablePlayers.length"
                    @click="submit"
                />
            </div>
        </template>
    </Dialog>
</template>
