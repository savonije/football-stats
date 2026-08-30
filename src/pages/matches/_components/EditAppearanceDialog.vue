<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useConfirmDialog } from '@/composables/useConfirmDialog';
    import { useMatchStore } from '@/stores/matchStore';
    import type { AppearanceWithName } from '@/types';

    const { seasonId, matchId, appearance } = defineProps<{
        seasonId: string;
        matchId: string;
        appearance: AppearanceWithName | null;
    }>();

    const visible = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useAppToast();
    const confirm = useConfirmDialog();
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

            toast.success(t('common.changesSaved'));
            closeDialog();
        } finally {
            loading.value = false;
        }
    };

    const confirmDelete = async () => {
        if (!appearance) return;

        const confirmed = await confirm({
            title: t('player.deletePlayer'),
            message: t('match.deletePlayerConfirm', [appearance.playerName]),
            confirmLabel: t('common.delete'),
            confirmColor: 'error',
        });

        if (!confirmed) return;

        await matchStore.deleteAppearance(seasonId, matchId, appearance.id);
        closeDialog();
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
    <UModal
        v-model:open="visible"
        :title="appearance?.playerName"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between gap-4">
                    <label for="goals">{{ $t('common.goal', 2) }}</label>
                    <UInputNumber
                        id="goals"
                        v-model="goals"
                        :min="0"
                        size="sm"
                    />
                </div>

                <div class="flex items-center justify-between gap-4">
                    <label for="isGoalkeeper">
                        {{ $t('player.wasKeeper') }}
                    </label>
                    <USwitch
                        id="isGoalkeeper"
                        v-model="isGoalkeeper"
                        name="isGoalkeeper"
                    />
                </div>

                <div class="flex items-center justify-between gap-4">
                    <label for="delete">{{ $t('match.deletePlayer') }}</label>
                    <UButton
                        class="self-start"
                        color="error"
                        icon="i-lucide-trash"
                        size="sm"
                        variant="outline"
                        :aria-label="$t('match.deletePlayer')"
                        @click="confirmDelete"
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
                    :label="$t('common.save')"
                    :loading="loading"
                    @click="save"
                />
            </div>
        </template>
    </UModal>
</template>
