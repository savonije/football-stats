<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { Button, Checkbox, Dialog, InputText, Select } from 'primevue';
    import { useToast } from 'primevue/usetoast';
    import { useI18n } from 'vue-i18n';

    import { TOAST_LIFE } from '@/constants';
    import { useStoreAuth } from '@/stores/authStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Player } from '@/types';
    import { playerSeasonInfo } from '@/utils/playerSeason';

    const visible = defineModel<boolean>('visible');
    const player = defineModel<Player | null>('player');

    const { t } = useI18n();
    const toast = useToast();
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
        toast.add({
            severity: 'success',
            summary: t('common.messages.success'),
            detail: t('player.messages.playerEditted'),
            life: TOAST_LIFE,
        });
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
    <Dialog
        v-if="authStore.user?.id"
        v-model:visible="visible"
        class="w-md"
        modal
        :header="t('player.editPlayer')"
        :draggable="false"
    >
        <div class="flex flex-col gap-4">
            <div>
                <label for="name">{{ $t('common.name') }}</label>
                <InputText v-model="editForm.name" fluid input-id="name" />
            </div>
            <div>
                <label for="clothingSize">{{
                    $t('common.clothingSize')
                }}</label>
                <Select
                    v-model="editForm.clothingSize"
                    :options="CLOTHING_SIZES"
                    :placeholder="$t('common.clothingSize')"
                    input-id="clothingSize"
                    fluid
                />
            </div>
            <div class="flex items-center gap-2">
                <Checkbox
                    v-model="editForm.hasJacket"
                    binary
                    input-id="hasJacket"
                />
                <label for="hasJacket">
                    {{ $t('common.hasJacket') }}
                </label>
            </div>
            <div class="flex items-center gap-2">
                <Checkbox v-model="editForm.hasBag" binary input-id="hasBag" />
                <label for="hasBag">
                    {{ $t('common.hasBag') }}
                </label>
            </div>

            <div
                class="mt-1 flex flex-col gap-3 rounded-lg border border-gray-200 p-3"
            >
                <p
                    class="text-xs font-bold tracking-wide text-gray-500 uppercase"
                >
                    {{ seasonStore.currentSeason }}
                </p>
                <div class="flex items-center gap-2">
                    <Checkbox
                        v-model="editSeason.active"
                        binary
                        input-id="seasonActive"
                    />
                    <label for="seasonActive">
                        {{ $t('player.activeThisSeason') }}
                    </label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox
                        v-model="editSeason.guestPlayer"
                        binary
                        input-id="guestPlayer"
                    />
                    <label for="guestPlayer">
                        {{ $t('player.guestPlayer') }}
                    </label>
                </div>
            </div>
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
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    @click="savePlayer"
                />
            </div>
        </template>
    </Dialog>
</template>
