<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useToast } from 'primevue/usetoast';
    import {
        Dialog,
        DatePicker,
        InputText,
        MultiSelect,
        Select,
        Button,
    } from 'primevue';
    import type { NewMatch } from '@/types';
    import { addMatch } from '@/services/matchService';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { isGuestInSeason } from '@/utils/playerSeason';
    import { TOAST_LIFE } from '@/constants';

    const model = defineModel<boolean>('visible');
    const { t } = useI18n();
    const toast = useToast();
    const seasonStore = useSeasonStore();
    const loading = ref(false);

    const form = reactive<NewMatch & { date: Date | null; players?: string[] }>(
        {
            opponent: '',
            date: new Date(),
            home: true,
            players: [],
            washing: '',
            result: { goalsFor: 0, goalsAgainst: 0 },
        },
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
        if (!form.opponent || !form.date) {
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
            await addMatch(seasonStore.currentSeason, {
                ...form,
                playerIds: form.players,
            });

            toast.add({
                severity: 'success',
                summary: t('common.messages.success'),
                detail: t('match.messages.matchAdded'),
                life: TOAST_LIFE,
            });
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                detail: t('match.messages.matchAddError'),
                life: TOAST_LIFE,
            });
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
    <Dialog
        v-model:visible="model"
        class="w-md"
        :header="t('match.addMatch')"
        modal
        closable
        dismissableMask
    >
        <div class="flex flex-col gap-3">
            <div>
                <label for="opponent">
                    {{ t('common.opponent') }}
                    <small>({{ t('common.required') }})</small>
                </label>
                <InputText
                    id="opponent"
                    v-model="form.opponent"
                    fluid
                    required
                />
            </div>

            <div>
                <label for="date">{{ t('common.date') }}</label>
                <DatePicker
                    v-model="form.date"
                    input-id="date"
                    dateFormat="dd-mm-yy"
                    showIcon
                    fluid
                />
            </div>

            <div>
                <label for="home">{{ t('common.homeOrAway') }}</label>
                <Select
                    v-model="form.home"
                    input-id="home"
                    :options="homeOptions"
                    optionLabel="label"
                    optionValue="value"
                    fluid
                />
            </div>

            <div>
                <label for="players">{{ t('player.player', 2) }}</label>
                <MultiSelect
                    v-model="form.players"
                    input-id="players"
                    :options="playerOptions"
                    optionLabel="label"
                    optionValue="value"
                    multiple
                    showClear
                    fluid
                />
            </div>

            <div>
                <label for="washing">{{ t('washing.washer') }}</label>
                <Select
                    v-model="form.washing"
                    input-id="washing"
                    :options="playerOptions"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="t('washing.notAssigned')"
                    showClear
                    fluid
                />
            </div>
        </div>

        <template #footer>
            <div class="flex w-full justify-between">
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    @click="closeDialog"
                />
                <Button
                    :label="$t('common.add')"
                    icon="pi pi-check"
                    :loading="loading"
                    @click="submitMatch"
                />
            </div>
        </template>
    </Dialog>
</template>
