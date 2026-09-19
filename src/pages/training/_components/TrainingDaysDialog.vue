<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useAppToast } from '@/composables/useAppToast';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { weekdayOptions } from '@/utils/training';
    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

    const model = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useAppToast();
    const seasonStore = useSeasonStore();

    const dayOptions = weekdayOptions();
    const saving = ref(false);
    const selectedTrainingDays = ref<number[]>([]);

    const save = async () => {
        saving.value = true;
        try {
            await seasonStore.setTrainingDays(
                seasonStore.currentSeason,
                selectedTrainingDays.value,
            );
            toast.success(t('training.messages.trainingDaysSaved'));
            model.value = false;
        } catch {
            toast.error(t('training.messages.trainingDaysSaveError'));
        } finally {
            saving.value = false;
        }
    };

    watch(
        [model, () => seasonStore.currentTrainingDays],
        ([visible, days]) => {
            if (visible) selectedTrainingDays.value = [...days];
        },
        { immediate: true },
    );
</script>

<template>
    <UModal
        v-model:open="model"
        :title="t('training.trainingDays')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex flex-col gap-2">
                <label>{{ t('training.trainingDays') }}</label>
                <USelectMenu
                    v-model="selectedTrainingDays"
                    class="w-full"
                    :aria-label="t('training.trainingDays')"
                    :items="dayOptions"
                    multiple
                    :placeholder="t('training.trainingDays')"
                    value-key="value"
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
