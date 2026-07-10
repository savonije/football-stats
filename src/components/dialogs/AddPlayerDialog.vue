<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { isActiveInSeason } from '@/utils/playerSeason';
    import { TOAST_LIFE } from '@/constants';
    import { useToast } from 'primevue/usetoast';
    import { useI18n } from 'vue-i18n';
    import {
        Dialog,
        InputText,
        Select,
        SelectButton,
        Checkbox,
        Button,
    } from 'primevue';

    const model = defineModel<boolean>('visible');
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const toast = useToast();
    const { t } = useI18n();

    const modeOptions = computed(() => [
        { label: t('player.existingPlayer'), value: 'existing' },
        { label: t('player.newPlayer'), value: 'new' },
    ]);
    const mode = ref<'existing' | 'new'>('existing');

    const loading = ref(false);

    // New player form
    const form = reactive({
        name: '',
        clothingSize: '' as string | undefined,
        hasJacket: false,
        hasBag: false,
        guestPlayer: false,
    });

    // Existing player selection
    const selectedPlayerId = ref<string | null>(null);
    const existingGuest = ref(false);

    const availablePlayers = computed(() =>
        playerStore.players
            .filter(
                (player) =>
                    !isActiveInSeason(player, seasonStore.currentSeason),
            )
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((player) => ({ label: player.name, value: player.id })),
    );

    const resetForm = () => {
        mode.value = 'existing';
        form.name = '';
        form.clothingSize = '';
        form.hasJacket = false;
        form.hasBag = false;
        form.guestPlayer = false;
        selectedPlayerId.value = null;
        existingGuest.value = false;
    };

    const closeDialog = () => {
        resetForm();
        model.value = false;
    };

    const warn = () => {
        toast.add({
            severity: 'warn',
            summary: t('common.validation.warning'),
            detail: t('common.validation.fillAll'),
            life: TOAST_LIFE,
        });
    };

    const addExisting = async () => {
        if (!selectedPlayerId.value) {
            warn();
            return;
        }
        await playerStore.setPlayerSeasonStatus(
            selectedPlayerId.value,
            seasonStore.currentSeason,
            { active: true, guestPlayer: existingGuest.value },
        );
        toast.add({
            severity: 'success',
            summary: t('common.messages.success'),
            detail: t('player.messages.playerAddedToSeason'),
            life: TOAST_LIFE,
        });
    };

    const addNew = async () => {
        if (!form.name.trim()) {
            warn();
            return;
        }
        await playerStore.addPlayer({
            id: crypto.randomUUID(),
            name: form.name.trim(),
            clothingSize: form.clothingSize || undefined,
            hasJacket: form.hasJacket,
            hasBag: form.hasBag,
            seasons: {
                [seasonStore.currentSeason]: {
                    active: true,
                    guestPlayer: form.guestPlayer,
                },
            },
        });
        toast.add({
            severity: 'success',
            summary: t('common.messages.success'),
            detail: t('player.messages.playerAdded'),
            life: TOAST_LIFE,
        });
    };

    const submit = async () => {
        loading.value = true;
        try {
            if (mode.value === 'existing') {
                await addExisting();
            } else {
                await addNew();
            }
            closeDialog();
        } catch {
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                life: TOAST_LIFE,
            });
        } finally {
            loading.value = false;
        }
    };

    onMounted(() => {
        if (!playerStore.playersLoaded) playerStore.fetchPlayers();
    });
</script>

<template>
    <Dialog
        v-model:visible="model"
        modal
        :header="t('player.addPlayer')"
        :style="{ width: '400px' }"
        :draggable="false"
    >
        <div class="flex flex-col gap-4">
            <SelectButton
                v-model="mode"
                :options="modeOptions"
                option-label="label"
                option-value="value"
                :allow-empty="false"
                fluid
            />

            <!-- Existing player -->
            <template v-if="mode === 'existing'">
                <p
                    v-if="!availablePlayers.length"
                    class="text-sm text-gray-600"
                >
                    {{ $t('player.allPlayersActive') }}
                </p>
                <template v-else>
                    <div>
                        <label for="existingPlayer">
                            {{ $t('player.player', 1) }}
                            <small>({{ $t('common.required') }})</small>
                        </label>
                        <Select
                            v-model="selectedPlayerId"
                            :options="availablePlayers"
                            option-label="label"
                            option-value="value"
                            :placeholder="$t('player.selectPlayer')"
                            input-id="existingPlayer"
                            filter
                            fluid
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <Checkbox
                            v-model="existingGuest"
                            binary
                            input-id="existingGuest"
                        />
                        <label for="existingGuest">
                            {{ $t('player.guestPlayer') }}
                        </label>
                    </div>
                </template>
            </template>

            <!-- New player -->
            <template v-else>
                <div>
                    <label for="name">
                        {{ $t('common.name') }}
                        <small>({{ $t('common.required') }})</small>
                    </label>
                    <InputText v-model="form.name" fluid input-id="name" />
                </div>

                <div>
                    <label for="clothingSize">
                        {{ $t('common.clothingSize') }}
                    </label>
                    <Select
                        v-model="form.clothingSize"
                        :options="[
                            '164',
                            '158',
                            '152',
                            '146',
                            '140',
                            '134',
                            '128',
                        ]"
                        :placeholder="$t('common.clothingSize')"
                        input-id="clothingSize"
                        fluid
                    />
                </div>

                <div class="flex items-center gap-2">
                    <Checkbox
                        v-model="form.hasJacket"
                        binary
                        input-id="hasJacket"
                    />
                    <label for="hasJacket">{{ $t('common.hasJacket') }}</label>
                </div>

                <div class="flex items-center gap-2">
                    <Checkbox v-model="form.hasBag" binary input-id="hasBag" />
                    <label for="hasBag">{{ $t('common.hasBag') }}</label>
                </div>

                <div class="flex items-center gap-2">
                    <Checkbox
                        v-model="form.guestPlayer"
                        binary
                        input-id="guestPlayer"
                    />
                    <label for="guestPlayer">
                        {{ $t('player.guestPlayer') }}
                    </label>
                </div>
            </template>
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
                    icon="pi pi-check"
                    :loading="loading"
                    :disabled="mode === 'existing' && !availablePlayers.length"
                    @click="submit"
                />
            </div>
        </template>
    </Dialog>
</template>
