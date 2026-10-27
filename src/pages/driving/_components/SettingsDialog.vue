<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { PLAYERS_PER_CAR } from '@/constants';
    import { useSettingsStore } from '@/stores/settingsStore';

    const model = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useAppToast();
    const settingsStore = useSettingsStore();

    const saving = ref(false);
    const playersPerCar = ref(PLAYERS_PER_CAR);

    const save = async () => {
        saving.value = true;
        try {
            await settingsStore.setPlayersPerCar(
                playersPerCar.value || PLAYERS_PER_CAR,
            );
            toast.success(t('common.changesSaved'));
            model.value = false;
        } catch (err) {
            console.error(err);
            toast.error(t('settings.messages.saveError'));
        } finally {
            saving.value = false;
        }
    };

    watch(
        [model, () => settingsStore.playersPerCar],
        ([visible, value]) => {
            if (visible) playersPerCar.value = value;
        },
        { immediate: true },
    );
</script>

<template>
    <UModal
        v-model:open="model"
        :title="t('driving.playersPerCar')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex items-center justify-between gap-4">
                <label for="playersPerCar">
                    {{ t('driving.playersPerCar') }}
                </label>
                <UInputNumber
                    id="playersPerCar"
                    v-model="playersPerCar"
                    :min="1"
                    @keyup.enter="save"
                />
            </div>
        </template>

        <template #footer>
            <DialogFooter
                :confirm-label="$t('common.save')"
                confirm-icon="i-lucide-check"
                :loading="saving"
                @cancel="model = false"
                @confirm="save"
            />
        </template>
    </UModal>
</template>
