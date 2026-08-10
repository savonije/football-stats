<script setup lang="ts">
    import { ref, watch } from 'vue';
    import {
        Button,
        Dialog,
        InputNumber,
        ToggleSwitch,
        useConfirm,
    } from 'primevue';
    import { useToast } from 'primevue/usetoast';
    import { useI18n } from 'vue-i18n';

    import { TOAST_LIFE } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import type { AppearanceWithName } from '@/types';

    const { seasonId, matchId, appearance } = defineProps<{
        seasonId: string;
        matchId: string;
        appearance: AppearanceWithName | null;
    }>();

    const visible = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useToast();
    const confirm = useConfirm();
    const matchStore = useMatchStore();

    const goals = ref(0);
    const isGoalkeeper = ref(false);
    const loading = ref(false);

    const closeDialog = () => (visible.value = false);

    const save = async () => {
        if (!appearance) return;

        loading.value = true;

        try {
            await matchStore.updateAppearance(
                seasonId,
                matchId,
                appearance.id,
                {
                    goals: goals.value ?? 0,
                    isGoalkeeper: isGoalkeeper.value,
                },
            );

            toast.add({
                severity: 'success',
                summary: t('common.messages.success'),
                detail: t('common.changesSaved'),
                life: TOAST_LIFE,
            });
            closeDialog();
        } finally {
            loading.value = false;
        }
    };

    const confirmDelete = () => {
        if (!appearance) return;

        confirm.require({
            message: t('match.deletePlayerConfirm', [appearance.playerName]),
            header: t('player.deletePlayer'),
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: t('common.cancel'),
            acceptLabel: t('common.delete'),
            acceptClass: 'p-button-danger',
            accept: async () => {
                await matchStore.deleteAppearance(
                    seasonId,
                    matchId,
                    appearance.id,
                );
                closeDialog();
            },
        });
    };

    // Only sync on open, so a live goal landing elsewhere doesn't overwrite
    // what the user is currently typing.
    watch(visible, (isVisible) => {
        if (!isVisible) return;
        goals.value = appearance?.goals ?? 0;
        isGoalkeeper.value = appearance?.isGoalkeeper ?? false;
    });
</script>

<template>
    <Dialog
        v-model:visible="visible"
        class="w-md"
        :header="appearance?.playerName"
        :draggable="false"
        modal
        dismissable-mask
    >
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-4">
                <label for="goals">{{ $t('common.goal', 2) }}</label>
                <InputNumber
                    v-model.number="goals"
                    input-id="goals"
                    :min="0"
                    show-buttons
                    size="small"
                />
            </div>

            <div class="flex items-center justify-between gap-4">
                <label for="isGoalkeeper">{{ $t('player.wasKeeper') }}</label>
                <ToggleSwitch
                    v-model="isGoalkeeper"
                    name="isGoalkeeper"
                    input-id="isGoalkeeper"
                />
            </div>

            <div class="flex items-center justify-between gap-4">
                <label for="delete">{{ $t('match.deletePlayer') }}</label>
                <Button
                    class="self-start"
                    icon="pi pi-trash"
                    severity="danger"
                    variant="outlined"
                    size="small"
                    @click="confirmDelete"
                />
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
                    :loading="loading"
                    @click="save"
                />
            </div>
        </template>
    </Dialog>
</template>
