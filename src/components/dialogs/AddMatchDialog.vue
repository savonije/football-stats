<script setup lang="ts">
    import type { CalendarDate } from '@internationalized/date';
    import { reactive, computed, onMounted, ref, shallowRef, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';
    import DatePicker from '@/components/ui/DatePicker.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { addMatch } from '@/services/matchService';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { NewMatch } from '@/types';
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

    const selectAllPlayers = () => {
        form.players = seasonPlayers.value
            .filter(
                (player) => !isGuestInSeason(player, seasonStore.currentSeason),
            )
            .map((player) => player.id);
    };

    watch(seasonPlayers, selectAllPlayers, { immediate: true });
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
                    <DatePicker id="date" v-model="date" />
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
                        :items="playerOptions"
                        multiple
                        :ui="{ input: '-order-1' }"
                        value-key="value"
                        data-testid="match-players"
                    >
                        <!-- #content-top renders above the search input, so the
                             input is reordered to keep the buttons below it -->
                        <template #content-top>
                            <div class="border-default flex gap-1 border-b">
                                <UButton
                                    block
                                    class="flex-1"
                                    color="neutral"
                                    variant="ghost"
                                    size="sm"
                                    icon="i-lucide-check-check"
                                    :label="t('common.selectAll')"
                                    data-testid="select-all-players"
                                    @click="selectAllPlayers"
                                />
                                <UButton
                                    block
                                    class="flex-1"
                                    color="neutral"
                                    variant="ghost"
                                    size="sm"
                                    icon="i-lucide-x"
                                    :disabled="!form.players?.length"
                                    :label="t('common.deselectAll')"
                                    data-testid="deselect-all-players"
                                    @click="form.players = []"
                                />
                            </div>
                        </template>
                    </USelectMenu>
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
            <DialogFooter
                :confirm-label="$t('common.add')"
                confirm-icon="i-lucide-check"
                :loading="loading"
                @cancel="closeDialog"
                @confirm="submitMatch"
            />
        </template>
    </UModal>
</template>
