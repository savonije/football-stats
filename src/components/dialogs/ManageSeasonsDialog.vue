<script setup lang="ts">
    import { ref, reactive, computed, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { DEFAULT_HALF_DURATION_MINUTES } from '@/constants';

    const model = defineModel<boolean>('visible');
    const seasonStore = useSeasonStore();
    const toast = useAppToast();
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
            toast.warn(t('seasons.messages.invalidHalfDuration'));
            return;
        }

        saving.value = true;
        try {
            await seasonStore.updateSeasonSettings(selectedId.value, {
                teamname: form.teamname,
                halfDurationMinutes: form.halfDurationMinutes,
            });
            toast.success(t('seasons.messages.settingsSaved'));
            model.value = false;
        } catch {
            toast.error(t('seasons.messages.saveError'));
        } finally {
            saving.value = false;
        }
    };

    const setActive = async () => {
        if (!selectedId.value) return;

        activating.value = true;
        try {
            await seasonStore.setActiveSeason(selectedId.value);
            toast.success(t('seasons.messages.activeChanged'));
        } catch {
            toast.error(t('seasons.messages.saveError'));
        } finally {
            activating.value = false;
        }
    };

    const addSeason = async () => {
        const id = newSeason.value.trim();

        if (!/^\d{4}-\d{4}$/.test(id)) {
            toast.warn(t('seasons.messages.invalidFormat'));
            return;
        }

        if (seasonStore.seasons.some((season) => season.id === id)) {
            toast.warn(t('seasons.messages.seasonExists'));
            return;
        }

        addLoading.value = true;
        try {
            await seasonStore.addSeason(id);
            newSeason.value = '';
            selectedId.value = id;

            toast.success(t('seasons.messages.seasonAdded'));
        } catch {
            toast.error(t('seasons.messages.saveError'));
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
    <UModal
        v-model:open="model"
        :title="t('seasons.title')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex flex-col gap-5">
                <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium">
                        {{ t('common.season') }}
                    </label>
                    <USelect
                        v-model="selectedId"
                        class="w-full"
                        :items="seasonStore.seasons"
                        label-key="id"
                        :placeholder="t('seasons.selectSeason')"
                        value-key="id"
                    >
                        <template #item="{ item }">
                            <div
                                class="flex w-full items-center justify-between gap-2"
                            >
                                <span>{{ item.id }}</span>
                                <UBadge
                                    v-if="item.active"
                                    color="success"
                                    variant="subtle"
                                >
                                    {{ t('seasons.active') }}
                                </UBadge>
                            </div>
                        </template>
                    </USelect>
                </div>

                <template v-if="selectedSeason">
                    <div
                        class="flex flex-col gap-4 rounded-lg border border-gray-200 p-4"
                    >
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium">
                                {{ t('seasons.activeSeason') }}
                            </span>
                            <UBadge
                                v-if="selectedSeason.active"
                                color="success"
                                variant="subtle"
                            >
                                {{ t('seasons.active') }}
                            </UBadge>
                            <UButton
                                v-else
                                color="neutral"
                                icon="i-lucide-circle-check"
                                :label="t('seasons.setActive')"
                                :loading="activating"
                                size="sm"
                                variant="subtle"
                                @click="setActive"
                            />
                        </div>

                        <div class="flex flex-col gap-1.5">
                            <label class="text-sm font-medium">
                                {{ t('seasons.teamName') }}
                            </label>
                            <UInput
                                v-model="form.teamname"
                                class="w-full"
                                :placeholder="t('seasons.teamNamePlaceholder')"
                                @keyup.enter="saveSettings"
                            />
                        </div>

                        <div class="flex flex-col gap-1.5">
                            <label class="text-sm font-medium">
                                {{ t('seasons.halfDuration') }}
                            </label>
                            <UInputNumber
                                v-model="form.halfDurationMinutes"
                                class="w-full"
                                :max="60"
                                :min="1"
                                :placeholder="
                                    t('seasons.halfDurationPlaceholder')
                                "
                                @keyup.enter="saveSettings"
                            />
                        </div>
                    </div>
                </template>

                <USeparator />

                <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium" for="newSeason">
                        {{ t('seasons.addSeason') }}
                    </label>
                    <div class="flex gap-2">
                        <UInput
                            id="newSeason"
                            v-model="newSeason"
                            class="flex-1"
                            :placeholder="t('seasons.newSeasonPlaceholder')"
                            @keyup.enter="addSeason"
                        />
                        <UButton
                            color="neutral"
                            icon="i-lucide-plus"
                            :label="t('common.add')"
                            :loading="addLoading"
                            variant="subtle"
                            @click="addSeason"
                        />
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex w-full justify-between">
                <UButton
                    color="neutral"
                    :label="t('common.cancel')"
                    variant="ghost"
                    @click="model = false"
                />
                <UButton
                    :disabled="!selectedSeason"
                    icon="i-lucide-check"
                    :label="t('common.save')"
                    :loading="saving"
                    @click="saveSettings"
                />
            </div>
        </template>
    </UModal>
</template>
