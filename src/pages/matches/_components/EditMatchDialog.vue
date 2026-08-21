<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { Button, DatePicker, Dialog, InputText, Select } from 'primevue';
    import { useToast } from 'primevue/usetoast';
    import { useI18n } from 'vue-i18n';

    import { TOAST_LIFE } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import type { Match } from '@/types';

    const { seasonId, match } = defineProps<{
        seasonId: string;
        match: Match | null;
    }>();

    const visible = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useToast();
    const matchStore = useMatchStore();

    const opponent = ref('');
    const date = ref<Date | null>(null);
    const home = ref(true);
    const loading = ref(false);

    const homeOptions = [
        { label: t('common.home'), value: true },
        { label: t('common.away'), value: false },
    ];

    const closeDialog = () => (visible.value = false);

    const save = async () => {
        if (!match) return;

        if (!opponent.value || !date.value) {
            toast.add({
                severity: 'warn',
                summary: t('common.validation.warning'),
                detail: t('common.validation.fillAll'),
                life: TOAST_LIFE,
            });
            return;
        }

        loading.value = true;

        try {
            await matchStore.updateMatch(seasonId, match.id, {
                opponent: opponent.value,
                date: date.value,
                home: home.value,
            });

            toast.add({
                severity: 'success',
                summary: t('common.messages.success'),
                detail: t('common.changesSaved'),
                life: TOAST_LIFE,
            });

            closeDialog();
        } catch (err) {
            console.error(err);
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                detail: t('match.messages.matchEditError'),
                life: TOAST_LIFE,
            });
        } finally {
            loading.value = false;
        }
    };

    watch(visible, (isVisible) => {
        if (!isVisible) return;
        opponent.value = match?.opponent ?? '';
        date.value = match?.date ? match.date.toDate() : null;
        home.value = match?.home ?? true;
    });
</script>

<template>
    <Dialog
        v-model:visible="visible"
        class="w-md"
        :header="t('match.editMatch')"
        :draggable="false"
        modal
        dismissable-mask
    >
        <div class="flex flex-col gap-3">
            <div>
                <label for="opponent">
                    {{ t('common.opponent') }}
                    <small>({{ t('common.required') }})</small>
                </label>
                <InputText id="opponent" v-model="opponent" fluid required />
            </div>

            <div>
                <label for="date">{{ t('common.date') }}</label>
                <DatePicker
                    v-model="date"
                    input-id="date"
                    dateFormat="dd-mm-yy"
                    showIcon
                    fluid
                />
            </div>

            <div>
                <label for="home">{{ t('common.homeOrAway') }}</label>
                <Select
                    v-model="home"
                    input-id="home"
                    :options="homeOptions"
                    optionLabel="label"
                    optionValue="value"
                    fluid
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
