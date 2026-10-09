<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { useSettingsStore } from '@/stores/settingsStore';

    const model = defineModel<boolean>('visible');
    const { t } = useI18n();
    const toast = useAppToast();
    const settingsStore = useSettingsStore();

    const sportlinkClientId = ref('');
    const regulationsEnabled = ref(false);
    const washingEnabled = ref(true);
    const loading = ref(false);

    const closeDialog = () => (model.value = false);

    const save = async () => {
        loading.value = true;
        try {
            await settingsStore.updateSettings({
                sportlinkClientId: sportlinkClientId.value,
                regulationsEnabled: regulationsEnabled.value,
                washingEnabled: washingEnabled.value,
            });
            toast.success(t('common.changesSaved'));
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.error(t('settings.messages.saveError'));
        } finally {
            loading.value = false;
        }
    };

    watch(model, (visible) => {
        if (!visible) return;
        sportlinkClientId.value = settingsStore.sportlinkClientId;
        regulationsEnabled.value = settingsStore.regulationsEnabled;
        washingEnabled.value = settingsStore.washingEnabled;
    });
</script>

<template>
    <UModal
        v-model:open="model"
        :title="t('settings.title')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div>
                <label for="sportlinkClientId">
                    {{ t('settings.sportlinkClientId') }}
                </label>
                <UInput
                    id="sportlinkClientId"
                    v-model="sportlinkClientId"
                    class="w-full"
                />
                <p class="mt-1 text-sm text-gray-500">
                    {{ t('settings.sportlinkClientIdHelp') }}
                </p>
            </div>

            <USwitch
                v-model="regulationsEnabled"
                class="mt-6"
                :label="t('settings.regulationsEnabled')"
            />

            <USwitch
                v-model="washingEnabled"
                class="mt-4"
                :label="t('settings.washingEnabled')"
            />
        </template>

        <template #footer>
            <DialogFooter
                :confirm-label="$t('common.save')"
                confirm-icon="i-lucide-check"
                :loading="loading"
                @cancel="closeDialog"
                @confirm="save"
            />
        </template>
    </UModal>
</template>
