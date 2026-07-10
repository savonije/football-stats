<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useToast } from 'primevue/usetoast';
    import { Dialog, DatePicker, Button, Message } from 'primevue';
    import dayjs from 'dayjs';

    import { addTrainings } from '@/services/trainingService';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { TOAST_LIFE } from '@/constants';

    const model = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useToast();
    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const loading = ref(false);

    const date = ref<Date>(new Date());

    const existingDates = computed(
        () =>
            new Set(
                trainingStore.trainings
                    .filter((tr) => tr.date)
                    .map((tr) => dayjs(tr.date.toDate()).format('YYYY-MM-DD')),
            ),
    );

    const dateExists = computed(() =>
        existingDates.value.has(dayjs(date.value).format('YYYY-MM-DD')),
    );

    const closeDialog = () => (model.value = false);

    const add = async () => {
        if (dateExists.value) return;

        loading.value = true;
        try {
            const count = await addTrainings(seasonStore.currentSeason, [
                date.value,
            ]);
            toast.add({
                severity: 'success',
                summary: t('common.messages.success'),
                detail: t('training.messages.trainingsGenerated', { count }),
                life: TOAST_LIFE,
            });
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                detail: t('training.messages.trainingAddError'),
                life: TOAST_LIFE,
            });
        } finally {
            loading.value = false;
        }
    };

    watch(model, (visible) => {
        if (visible) date.value = new Date();
    });
</script>

<template>
    <Dialog
        v-model:visible="model"
        :header="t('training.addForDate')"
        modal
        closable
        dismissableMask
    >
        <div class="flex flex-col gap-4">
            <div>
                <label>{{ t('training.selectDate') }}</label>
                <DatePicker
                    v-model="date"
                    dateFormat="dd-mm-yy"
                    showIcon
                    fluid
                />
            </div>

            <Message
                v-if="dateExists && !loading"
                severity="warn"
                :closable="false"
            >
                {{ t('training.dateExists') }}
            </Message>
        </div>

        <template #footer>
            <div class="flex w-full justify-between gap-3">
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    @click="closeDialog"
                />
                <Button
                    :label="$t('training.add')"
                    icon="pi pi-check"
                    :loading="loading"
                    :disabled="dateExists"
                    @click="add"
                />
            </div>
        </template>
    </Dialog>
</template>
