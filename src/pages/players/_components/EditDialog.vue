<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useStoreAuth } from '@/stores/authStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Player } from '@/types';
    import { playerSeasonInfo } from '@/utils/playerSeason';

    const visible = defineModel<boolean>('visible');
    const player = defineModel<Player | null>('player');

    const { t } = useI18n();
    const toast = useAppToast();
    const authStore = useStoreAuth();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();

    const CLOTHING_SIZES = ['164', '158', '152', '146', '140', '134', '128'];

    const editForm = ref<Partial<Player>>({});
    const editSeason = ref({ active: true, guestPlayer: false });

    const closeDialog = () => (visible.value = false);

    const savePlayer = async () => {
        if (!player.value) return;

        const seasonId = seasonStore.currentSeason;
        const seasonInfo = { ...editSeason.value };

        await playerStore.updatePlayer(player.value.id, editForm.value);
        await playerStore.setPlayerSeasonStatus(
            player.value.id,
            seasonId,
            seasonInfo,
        );

        player.value = {
            ...player.value,
            ...editForm.value,
            seasons: { ...player.value.seasons, [seasonId]: seasonInfo },
        } as Player;

        closeDialog();
        toast.success(t('player.messages.playerEditted'));
    };

    // Only sync on open, so the form isn't reset while the user is editing.
    watch(visible, (isVisible) => {
        if (!isVisible || !player.value) return;

        const { seasons, ...identity } = player.value;
        void seasons;
        editForm.value = { ...identity };

        const info = playerSeasonInfo(player.value, seasonStore.currentSeason);
        editSeason.value = {
            active: info?.active ?? true,
            guestPlayer: info?.guestPlayer ?? false,
        };
    });
</script>

<template>
    <UModal
        v-if="authStore.user?.id"
        v-model:open="visible"
        :title="t('player.editPlayer')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex flex-col gap-4">
                <div>
                    <label for="name">{{ $t('common.name') }}</label>
                    <UInput id="name" v-model="editForm.name" class="w-full" />
                </div>
                <div>
                    <label for="clothingSize">
                        {{ $t('common.clothingSize') }}
                    </label>
                    <USelect
                        id="clothingSize"
                        v-model="editForm.clothingSize"
                        class="w-full"
                        :items="CLOTHING_SIZES"
                        :placeholder="$t('common.clothingSize')"
                    />
                </div>
                <UCheckbox
                    v-model="editForm.hasJacket"
                    :label="$t('common.hasJacket')"
                />
                <UCheckbox
                    v-model="editForm.hasBag"
                    :label="$t('common.hasBag')"
                />

                <div
                    class="mt-1 flex flex-col gap-3 rounded-lg border border-gray-200 p-3"
                >
                    <p
                        class="text-xs font-bold tracking-wide text-gray-500 uppercase"
                    >
                        {{ seasonStore.currentSeason }}
                    </p>
                    <UCheckbox
                        v-model="editSeason.active"
                        :label="$t('player.activeThisSeason')"
                    />
                    <UCheckbox
                        v-model="editSeason.guestPlayer"
                        :label="$t('player.guestPlayer')"
                    />
                </div>
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
                    icon="i-lucide-check"
                    :label="$t('common.save')"
                    @click="savePlayer"
                />
            </div>
        </template>
    </UModal>
</template>
