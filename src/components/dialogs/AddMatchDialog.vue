<script setup lang="ts">
    import type { CalendarDate } from '@internationalized/date';
    import { reactive, computed, onMounted, ref, shallowRef, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import type { NewMatch } from '@/types';
    import { addMatch } from '@/services/matchService';
    import { useAppToast } from '@/composables/useAppToast';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { fromCalendarDate, toCalendarDate } from '@/utils/date';
    import { isGuestInSeason } from '@/utils/playerSeason';

    const model = defineModel<boolean>('visible');
    const { t } = useI18n();
    const toast = useAppToast();
    const seasonStore = useSeasonStore();
    const loading = ref(false);

    const form = reactive<Omit<NewMatch, 'date'> & { players?: string[] }>({
        opponent: '',
        home: true,
        players: [],
        washing: '',
        result: { goalsFor: 0, goalsAgainst: 0 },
    });

    // UInputDate speaks CalendarDate; the service wants a plain Date.
    const date = shallowRef<CalendarDate | undefined>(
        toCalendarDate(new Date()),
    );

    const homeOptions = [
        { label: t('common.home'), value: true },
        { label: t('common.away'), value: false },
    ];

    const playerStore = usePlayerStore();

    const seasonPlayers = computed(() =>
        playerStore.playersInSeason(seasonStore.currentSeason),
    );

    const playerOptions = computed(() =>
        seasonPlayers.value.map((player) => ({
            label: player.name,
            value: player.id,
        })),
    );

    const closeDialog = () => (model.value = false);

    const submitMatch = async () => {
        const matchDate = fromCalendarDate(date.value);

        if (!form.opponent || !matchDate) {
            toast.warn(t('common.validation.fillAll'));
            return;
        }

        loading.value = true;
        try {
            await addMatch(seasonStore.currentSeason, {
                ...form,
                date: matchDate,
                playerIds: form.players,
            });

            toast.success(t('match.messages.matchAdded'));
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.error(t('match.messages.matchAddError'));
        } finally {
            loading.value = false;
        }
    };

    onMounted(async () => {
        await playerStore.fetchPlayers();
    });

    watch(
        seasonPlayers,
        (players) => {
            form.players = players
                .filter(
                    (player) =>
                        !isGuestInSeason(player, seasonStore.currentSeason),
                )
                .map((player) => player.id);
        },
        { immediate: true },
    );
</script>

<template>
    <UModal
        v-model:open="model"
        :title="t('match.addMatch')"
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
                        v-model="form.opponent"
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
                        v-model="form.home"
                        class="w-full"
                        :items="homeOptions"
                    />
                </div>

                <div>
                    <label for="players">{{ t('player.player', 2) }}</label>
                    <USelectMenu
                        id="players"
                        v-model="form.players"
                        class="w-full"
                        data-testid="match-players"
                        :items="playerOptions"
                        multiple
                        value-key="value"
                    />
                </div>

                <div>
                    <label for="washing">{{ t('washing.washer') }}</label>
                    <USelect
                        id="washing"
                        v-model="form.washing"
                        class="w-full"
                        :items="playerOptions"
                        :placeholder="t('washing.notAssigned')"
                        value-key="value"
                    />
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex w-full justify-between">
                <UButton
                    color="neutral"
                    :label="$t('common.cancel')"
                    variant="subtle"
                    @click="closeDialog"
                />
                <UButton
                    icon="i-lucide-check"
                    :label="$t('common.add')"
                    :loading="loading"
                    @click="submitMatch"
                />
            </div>
        </template>
    </UModal>
</template>
