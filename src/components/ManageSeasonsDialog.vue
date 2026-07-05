<script setup lang="ts">
    import { ref } from 'vue';
    import {
        Dialog,
        InputText,
        InputMask,
        MultiSelect,
        Button,
        Tag,
        useToast,
    } from 'primevue';
    import { useI18n } from 'vue-i18n';

    import { useSeasonStore } from '@/stores/seasonStore';
    import { weekdayOptions } from '@/utils/training';
    import { TOAST_LIFE } from '@/constants';

    const model = defineModel<boolean>('visible');
    const seasonStore = useSeasonStore();
    const toast = useToast();
    const { t } = useI18n();

    const newSeason = ref('');
    const addLoading = ref(false);
    const activatingId = ref<string | null>(null);
    const teamNames = ref<Record<string, string>>({});
    const savingTeamNameId = ref<string | null>(null);
    const trainingDays = ref<Record<string, number[]>>({});
    const savingTrainingDaysId = ref<string | null>(null);
    const dayOptions = weekdayOptions();

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

    const saveTeamName = async (id: string) => {
        const season = seasonStore.seasons.find((s) => s.id === id);
        const value = (teamNames.value[id] ?? season?.teamname ?? '').trim();

        savingTeamNameId.value = id;
        try {
            await seasonStore.setTeamName(id, value);
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('seasons.messages.teamNameChanged'),
                life: TOAST_LIFE,
            });
        } catch {
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                life: TOAST_LIFE,
            });
        } finally {
            savingTeamNameId.value = null;
        }
    };

    const saveTrainingDays = async (id: string) => {
        const season = seasonStore.seasons.find((s) => s.id === id);
        const days = trainingDays.value[id] ?? season?.trainingDays ?? [];

        savingTrainingDaysId.value = id;
        try {
            await seasonStore.setTrainingDays(id, days);
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('training.messages.trainingDaysSaved'),
                life: TOAST_LIFE,
            });
        } catch {
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                life: TOAST_LIFE,
            });
        } finally {
            savingTrainingDaysId.value = null;
        }
    };

    const setActive = async (id: string) => {
        activatingId.value = id;
        try {
            await seasonStore.setActiveSeason(id);
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
            activatingId.value = null;
        }
    };
</script>

<template>
    <Dialog
        v-model:visible="model"
        modal
        :header="t('seasons.title')"
        :draggable="false"
    >
        <div class="flex flex-col gap-6">
            <div>
                <p
                    class="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase"
                >
                    {{ t('seasons.activeSeason') }}
                </p>
                <ul class="flex flex-col gap-2">
                    <li
                        v-for="season in seasonStore.seasons"
                        :key="season.id"
                        class="flex flex-col gap-2 rounded border border-gray-200 px-3 py-2"
                    >
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-2 font-medium">
                                {{ season.id }}
                            </span>
                            <Tag
                                v-if="season.active"
                                :value="t('seasons.active')"
                                severity="success"
                            />
                            <Button
                                v-if="!season.active"
                                :label="t('seasons.setActive')"
                                size="small"
                                severity="secondary"
                                :loading="activatingId === season.id"
                                @click="setActive(season.id)"
                            />
                        </div>
                        <div class="flex gap-2">
                            <InputText
                                class="flex-1"
                                :model-value="
                                    teamNames[season.id] ??
                                    season.teamname ??
                                    ''
                                "
                                size="small"
                                :placeholder="t('seasons.teamNamePlaceholder')"
                                :aria-label="t('seasons.teamName')"
                                @update:model-value="
                                    teamNames[season.id] = $event ?? ''
                                "
                                @keyup.enter="saveTeamName(season.id)"
                            />
                            <Button
                                icon="pi pi-check"
                                size="small"
                                severity="secondary"
                                :label="t('common.save')"
                                :aria-label="t('common.save')"
                                :loading="savingTeamNameId === season.id"
                                @click="saveTeamName(season.id)"
                            />
                        </div>
                        <div class="flex gap-2">
                            <MultiSelect
                                class="flex-1"
                                :model-value="
                                    trainingDays[season.id] ??
                                    season.trainingDays ??
                                    []
                                "
                                :options="dayOptions"
                                option-label="label"
                                option-value="value"
                                size="small"
                                display="chip"
                                :placeholder="t('training.trainingDays')"
                                :aria-label="t('training.trainingDays')"
                                @update:model-value="
                                    trainingDays[season.id] = $event
                                "
                            />
                            <Button
                                icon="pi pi-check"
                                size="small"
                                severity="secondary"
                                :label="t('common.save')"
                                :aria-label="t('common.save')"
                                :loading="savingTrainingDaysId === season.id"
                                @click="saveTrainingDays(season.id)"
                            />
                        </div>
                    </li>
                </ul>
            </div>

            <div class="flex flex-col gap-2">
                <label for="newSeason">{{ t('seasons.addSeason') }}</label>
                <div class="flex gap-2">
                    <InputMask
                        id="newSeason"
                        v-model="newSeason"
                        mask="9999-9999"
                        :placeholder="t('seasons.newSeasonPlaceholder')"
                        @keyup.enter="addSeason"
                    />
                    <Button
                        :label="t('common.add')"
                        icon="pi pi-plus"
                        :loading="addLoading"
                        @click="addSeason"
                    />
                </div>
            </div>
        </div>
    </Dialog>
</template>
