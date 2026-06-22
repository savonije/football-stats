<script setup lang="ts">
    import { ref } from 'vue';
    import { Dialog, InputText, Button, Tag, useToast } from 'primevue';
    import { useI18n } from 'vue-i18n';

    import { useSeasonStore } from '@/stores/seasonStore';
    import { TOAST_LIFE } from '@/constants';

    const model = defineModel<boolean>('visible');
    const seasonStore = useSeasonStore();
    const toast = useToast();
    const { t } = useI18n();

    const newSeason = ref('');
    const addLoading = ref(false);
    const activatingId = ref<string | null>(null);

    const isValidFormat = (value: string): boolean => {
        const match = value.match(/^(\d{4})-(\d{4})$/);
        if (!match) return false;
        return Number(match[2]) === Number(match[1]) + 1;
    };

    const warn = (detail: string) => {
        toast.add({
            severity: 'warn',
            summary: t('common.validation.warning'),
            detail,
            life: TOAST_LIFE,
        });
    };

    const addSeason = async () => {
        const id = newSeason.value.trim();

        if (!isValidFormat(id)) {
            warn(t('seasons.messages.invalidFormat'));
            return;
        }
        if (seasonStore.seasons.some((season) => season.id === id)) {
            warn(t('seasons.messages.seasonExists'));
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
        :style="{ width: '420px' }"
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
                        class="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
                    >
                        <span class="flex items-center gap-2 font-medium">
                            {{ season.id }}
                            <Tag
                                v-if="season.active"
                                :value="t('seasons.active')"
                                severity="success"
                            />
                        </span>
                        <Button
                            v-if="!season.active"
                            :label="t('seasons.setActive')"
                            size="small"
                            severity="secondary"
                            :loading="activatingId === season.id"
                            @click="setActive(season.id)"
                        />
                    </li>
                </ul>
            </div>

            <div class="flex flex-col gap-2">
                <label for="newSeason">{{ t('seasons.addSeason') }}</label>
                <div class="flex gap-2">
                    <InputText
                        id="newSeason"
                        v-model="newSeason"
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
