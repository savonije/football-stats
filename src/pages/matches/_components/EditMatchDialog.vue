<script setup lang="ts">
    import type { CalendarDate } from '@internationalized/date';
    import { ref, shallowRef, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useMatchStore } from '@/stores/matchStore';
    import type { Match } from '@/types';
    import { fromCalendarDate, toCalendarDate } from '@/utils/date';

    const { seasonId, match } = defineProps<{
        seasonId: string;
        match: Match | null;
    }>();

    const visible = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useAppToast();
    const matchStore = useMatchStore();

    const opponent = ref('');
    const date = shallowRef<CalendarDate | undefined>();
    const home = ref(true);
    const loading = ref(false);

    const homeOptions = [
        { label: t('common.home'), value: true },
        { label: t('common.away'), value: false },
    ];

    const closeDialog = () => (visible.value = false);

    const save = async () => {
        if (!match) return;

        const matchDate = fromCalendarDate(date.value);

        if (!opponent.value || !matchDate) {
            toast.warn(t('common.validation.fillAll'));
            return;
        }

        loading.value = true;

        try {
            await matchStore.updateMatch(seasonId, match.id, {
                opponent: opponent.value,
                date: matchDate,
                home: home.value,
            });

            toast.success(t('common.changesSaved'));

            closeDialog();
        } catch (err) {
            console.error(err);
            toast.error(t('match.messages.matchEditError'));
        } finally {
            loading.value = false;
        }
    };

    watch(visible, (isVisible) => {
        if (!isVisible) return;
        opponent.value = match?.opponent ?? '';
        date.value = toCalendarDate(match?.date ? match.date.toDate() : null);
        home.value = match?.home ?? true;
    });
</script>

<template>
    <UModal
        v-model:open="visible"
        :title="t('match.editMatch')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex flex-col gap-3">
                <div>
                    <label for="opponent">
                        {{ t('common.opponent') }}
                        <small>({{ t('common.required') }})</small>
                    </label>
                    <UInput
                        id="opponent"
                        v-model="opponent"
                        class="w-full"
                        required
                    />
                </div>

                <div>
                    <label for="date">{{ t('common.date') }}</label>
                    <UInputDate
                        id="date"
                        v-model="date"
                        class="w-full"
                        icon="i-lucide-calendar"
                    />
                </div>

                <div>
                    <label for="home">{{ t('common.homeOrAway') }}</label>
                    <USelect
                        id="home"
                        v-model="home"
                        class="w-full"
                        :items="homeOptions"
                    />
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex w-full justify-between">
                <UButton
                    color="neutral"
                    :label="$t('common.cancel')"
                    variant="ghost"
                    @click="closeDialog"
                />

                <UButton
                    :label="$t('common.save')"
                    :loading="loading"
                    @click="save"
                />
            </div>
        </template>
    </UModal>
</template>
