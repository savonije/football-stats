<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useToast } from 'primevue/usetoast';
    import { Dialog, MultiSelect, Button } from 'primevue';

    import { useSeasonStore } from '@/stores/seasonStore';
    import { weekdayOptions } from '@/utils/training';
    import { TOAST_LIFE } from '@/constants';

    const model = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useToast();
    const seasonStore = useSeasonStore();

    const dayOptions = weekdayOptions();
    const saving = ref(false);
    const selectedTrainingDays = ref<number[]>([]);

    const currentSeasonTrainingDays = computed(
        () =>
            seasonStore.seasons.find((s) => s.id === seasonStore.currentSeason)
                ?.trainingDays ?? [],
    );

    const save = async () => {
        saving.value = true;
        try {
            await seasonStore.setTrainingDays(
                seasonStore.currentSeason,
                selectedTrainingDays.value,
            );
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('training.messages.trainingDaysSaved'),
                life: TOAST_LIFE,
            });
            model.value = false;
        } catch {
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                life: TOAST_LIFE,
            });
        } finally {
            saving.value = false;
        }
    };

    watch(
        [model, currentSeasonTrainingDays],
        ([visible, days]) => {
            if (visible) selectedTrainingDays.value = [...days];
        },
        { immediate: true },
    );
</script>

<template>
    <Dialog
        v-model:visible="model"
        :header="t('training.trainingDays')"
        modal
        closable
        dismissableMask
    >
        <div class="flex flex-col gap-2">
            <label>{{ t('training.trainingDays') }}</label>
            <MultiSelect
                v-model="selectedTrainingDays"
                :options="dayOptions"
                option-label="label"
                option-value="value"
                display="chip"
                :placeholder="t('training.trainingDays')"
                :aria-label="t('training.trainingDays')"
                fluid
            />
        </div>

        <template #footer>
            <div class="flex w-full justify-between">
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    @click="model = false"
                />
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="save"
                />
            </div>
        </template>
    </Dialog>
</template>
