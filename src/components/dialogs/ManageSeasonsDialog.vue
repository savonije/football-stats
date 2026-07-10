<script setup lang="ts">
    import { ref, reactive, computed, watch } from 'vue';
    import {
        Dialog,
        Select,
        InputText,
        InputMask,
        InputNumber,
        Button,
        Tag,
        Divider,
        useToast,
    } from 'primevue';
    import { useI18n } from 'vue-i18n';

    import { useSeasonStore } from '@/stores/seasonStore';
    import { TOAST_LIFE, DEFAULT_HALF_DURATION_MINUTES } from '@/constants';

    const model = defineModel<boolean>('visible');
    const seasonStore = useSeasonStore();
    const toast = useToast();
    const { t } = useI18n();

    const selectedId = ref('');
    const form = reactive<{
        teamname: string;
        halfDurationMinutes: number | null;
    }>({
        teamname: '',
        halfDurationMinutes: DEFAULT_HALF_DURATION_MINUTES,
    });

    const newSeason = ref('');
    const addLoading = ref(false);
    const saving = ref(false);
    const activating = ref(false);

    const selectedSeason = computed(() =>
        seasonStore.seasons.find((season) => season.id === selectedId.value),
    );

    const populateForm = () => {
        form.teamname = selectedSeason.value?.teamname ?? '';
        form.halfDurationMinutes =
            selectedSeason.value?.halfDurationMinutes ??
            DEFAULT_HALF_DURATION_MINUTES;
    };

    const saveSettings = async () => {
        if (!selectedId.value) return;

        if (form.halfDurationMinutes == null || form.halfDurationMinutes <= 0) {
            toast.add({
                severity: 'warn',
                summary: t('common.validation.warning'),
                life: TOAST_LIFE,
            });
            return;
        }

        saving.value = true;
        try {
            await seasonStore.updateSeasonSettings(selectedId.value, {
                teamname: form.teamname,
                halfDurationMinutes: form.halfDurationMinutes,
            });
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('seasons.messages.settingsSaved'),
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

    const setActive = async () => {
        if (!selectedId.value) return;

        activating.value = true;
        try {
            await seasonStore.setActiveSeason(selectedId.value);
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('seasons.messages.activeChanged'),
                life: TOAST_LIFE,
            });
        } catch {
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                life: TOAST_LIFE,
            });
        } finally {
            activating.value = false;
        }
    };

    const addSeason = async () => {
        const id = newSeason.value.trim();

        if (seasonStore.seasons.some((season) => season.id === id)) {
            toast.add({
                severity: 'warn',
                summary: t('common.validation.warning'),
                detail: t('seasons.messages.seasonExists'),
                life: TOAST_LIFE,
            });
            return;
        }

        addLoading.value = true;
        try {
            await seasonStore.addSeason(id);
            newSeason.value = '';
            selectedId.value = id;

            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('seasons.messages.seasonAdded'),
                life: TOAST_LIFE,
            });
        } catch {
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                life: TOAST_LIFE,
            });
        } finally {
            addLoading.value = false;
        }
    };

    watch(selectedId, populateForm);

    watch(
        model,
        (visible) => {
            if (!visible) return;
            selectedId.value =
                seasonStore.currentSeason ||
                seasonStore.activeSeasonId ||
                seasonStore.seasons[0]?.id ||
                '';
            populateForm();
        },
        { immediate: true },
    );
</script>

<template>
    <Dialog
        v-model:visible="model"
        class="w-md"
        modal
        closable
        dismissableMask
        :header="t('seasons.title')"
        :draggable="false"
    >
        <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium">
                    {{ t('common.season') }}
                </label>
                <Select
                    v-model="selectedId"
                    :options="seasonStore.seasons"
                    option-label="id"
                    option-value="id"
                    :placeholder="t('seasons.selectSeason')"
                    fluid
                >
                    <template #option="{ option }">
                        <div
                            class="flex w-full items-center justify-between gap-2"
                        >
                            <span>{{ option.id }}</span>
                            <Tag
                                v-if="option.active"
                                :value="t('seasons.active')"
                                severity="success"
                            />
                        </div>
                    </template>
                </Select>
            </div>

            <template v-if="selectedSeason">
                <div
                    class="flex flex-col gap-4 rounded-lg border border-gray-200 p-4"
                >
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium">
                            {{ t('seasons.activeSeason') }}
                        </span>
                        <Tag
                            v-if="selectedSeason.active"
                            :value="t('seasons.active')"
                            severity="success"
                        />
                        <Button
                            v-else
                            :label="t('seasons.setActive')"
                            icon="pi pi-check-circle"
                            size="small"
                            severity="secondary"
                            :loading="activating"
                            @click="setActive"
                        />
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-medium">{{
                            t('seasons.teamName')
                        }}</label>
                        <InputText
                            v-model="form.teamname"
                            :placeholder="t('seasons.teamNamePlaceholder')"
                            fluid
                            @keyup.enter="saveSettings"
                        />
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-medium">{{
                            t('seasons.halfDuration')
                        }}</label>
                        <InputNumber
                            v-model="form.halfDurationMinutes"
                            :min="1"
                            :max="60"
                            suffix=" min"
                            :placeholder="t('seasons.halfDurationPlaceholder')"
                            fluid
                            @keyup.enter="saveSettings"
                        />
                    </div>
                </div>
            </template>

            <Divider class="!my-0" />

            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium" for="newSeason">{{
                    t('seasons.addSeason')
                }}</label>
                <div class="flex gap-2">
                    <InputMask
                        id="newSeason"
                        v-model="newSeason"
                        mask="9999-9999"
                        :placeholder="t('seasons.newSeasonPlaceholder')"
                        fluid
                        @keyup.enter="addSeason"
                    />
                    <Button
                        :label="t('common.add')"
                        icon="pi pi-plus"
                        severity="secondary"
                        :loading="addLoading"
                        @click="addSeason"
                    />
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex w-full justify-between">
                <Button
                    :label="t('common.cancel')"
                    severity="secondary"
                    text
                    @click="model = false"
                />
                <Button
                    :label="t('common.save')"
                    icon="pi pi-check"
                    :loading="saving"
                    :disabled="!selectedSeason"
                    @click="saveSettings"
                />
            </div>
        </template>
    </Dialog>
</template>
