<script setup lang="ts">
    import type { CalendarDate } from '@internationalized/date';
    import dayjs from 'dayjs';
    import { ref, shallowRef, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';
    import DatePicker from '@/components/ui/DatePicker.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { CLUBNAME } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import type { Match } from '@/types';
    import {
        fromCalendarDate,
        hasKickoffTime,
        toCalendarDate,
    } from '@/utils/date';
    import { isPlayed } from '@/utils/match';

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
    const kickoff = ref('');
    const home = ref(true);
    const location = ref('');
    const field = ref('');
    const dressingRoom = ref('');
    const goalsFor = ref(0);
    const goalsAgainst = ref(0);
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

        const [hours = 0, minutes = 0] = kickoff.value.split(':').map(Number);
        matchDate.setHours(hours, minutes);

        loading.value = true;

        try {
            await matchStore.updateMatch(seasonId, match.id, {
                opponent: opponent.value,
                date: matchDate,
                home: home.value,
                location: location.value.trim(),
                field: field.value.trim(),
                dressingRoom: dressingRoom.value.trim(),
                goalsFor: goalsFor.value,
                goalsAgainst: goalsAgainst.value,
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
        const matchDate = match?.date ? match.date.toDate() : null;
        date.value = toCalendarDate(matchDate);
        kickoff.value =
            matchDate && hasKickoffTime(matchDate)
                ? dayjs(matchDate).format('HH:mm')
                : '';
        home.value = match?.home ?? true;
        location.value = match?.location ?? '';
        field.value = match?.field ?? '';
        dressingRoom.value = match?.dressingRoom ?? '';
        goalsFor.value = match?.result?.goalsFor ?? 0;
        goalsAgainst.value = match?.result?.goalsAgainst ?? 0;
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

                <div class="flex gap-3">
                    <div class="flex-1">
                        <label for="date">{{ t('common.date') }}</label>
                        <DatePicker id="date" v-model="date" />
                    </div>

                    <div class="w-32">
                        <label for="kickoff">{{ t('match.kickoff') }}</label>
                        <UInput
                            id="kickoff"
                            v-model="kickoff"
                            class="w-full"
                            type="time"
                        />
                    </div>
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

                <div>
                    <label for="location">{{
                        t('match.venue.location')
                    }}</label>
                    <UInput id="location" v-model="location" class="w-full" />
                </div>

                <div class="flex gap-3">
                    <div class="flex-1">
                        <label for="field">{{ t('match.venue.field') }}</label>
                        <UInput id="field" v-model="field" class="w-full" />
                    </div>

                    <div class="flex-1">
                        <label for="dressingRoom">
                            {{ t('match.venue.dressingRoom') }}
                        </label>
                        <UInput
                            id="dressingRoom"
                            v-model="dressingRoom"
                            class="w-full"
                        />
                    </div>
                </div>

                <div v-if="isPlayed(match)" class="flex gap-3">
                    <div class="flex-1">
                        <label for="goalsFor">{{ CLUBNAME }}</label>
                        <UInputNumber
                            id="goalsFor"
                            v-model="goalsFor"
                            class="w-full"
                            :min="0"
                        />
                    </div>

                    <div class="flex-1">
                        <label for="goalsAgainst">
                            {{ t('common.opponent') }}
                        </label>
                        <UInputNumber
                            id="goalsAgainst"
                            v-model="goalsAgainst"
                            class="w-full"
                            :min="0"
                        />
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <DialogFooter
                :confirm-label="$t('common.save')"
                :loading="loading"
                @cancel="closeDialog"
                @confirm="save"
            />
        </template>
    </UModal>
</template>
