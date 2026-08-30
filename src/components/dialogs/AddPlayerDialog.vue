<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { isActiveInSeason } from '@/utils/playerSeason';

    const model = defineModel<boolean>('visible');
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const toast = useAppToast();
    const { t } = useI18n();

    const CLOTHING_SIZES = ['164', '158', '152', '146', '140', '134', '128'];

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

    const warn = () => toast.warn(t('common.validation.fillAll'));

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
        toast.success(t('player.messages.playerAddedToSeason'));
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
        toast.success(t('player.messages.playerAdded'));
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
            toast.error(t('player.messages.playerAddError'));
        } finally {
            loading.value = false;
        }
    };

    onMounted(() => {
        if (!playerStore.playersLoaded) playerStore.fetchPlayers();
    });
</script>

<template>
    <UModal
        v-model:open="model"
        :title="t('player.addPlayer')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <div class="flex flex-col gap-4">
                <UTabs
                    v-model="mode"
                    :content="false"
                    :items="modeOptions"
                    :ui="{ list: 'w-full', trigger: 'flex-1' }"
                    variant="pill"
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
                            <USelectMenu
                                id="existingPlayer"
                                v-model="selectedPlayerId"
                                class="w-full"
                                :items="availablePlayers"
                                :placeholder="$t('player.selectPlayer')"
                                value-key="value"
                            />
                        </div>
                        <UCheckbox
                            v-model="existingGuest"
                            :label="$t('player.guestPlayer')"
                        />
                    </template>
                </template>

                <!-- New player -->
                <template v-else>
                    <div>
                        <label for="name">
                            {{ $t('common.name') }}
                            <small>({{ $t('common.required') }})</small>
                        </label>
                        <UInput id="name" v-model="form.name" class="w-full" />
                    </div>

                    <div>
                        <label for="clothingSize">
                            {{ $t('common.clothingSize') }}
                        </label>
                        <USelect
                            id="clothingSize"
                            v-model="form.clothingSize"
                            class="w-full"
                            :items="CLOTHING_SIZES"
                            :placeholder="$t('common.clothingSize')"
                        />
                    </div>

                    <UCheckbox
                        v-model="form.hasJacket"
                        :label="$t('common.hasJacket')"
                    />

                    <UCheckbox
                        v-model="form.hasBag"
                        :label="$t('common.hasBag')"
                    />

                    <UCheckbox
                        v-model="form.guestPlayer"
                        :label="$t('player.guestPlayer')"
                    />
                </template>
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
                    :disabled="mode === 'existing' && !availablePlayers.length"
                    icon="i-lucide-check"
                    :label="$t('common.save')"
                    :loading="loading"
                    @click="submit"
                />
            </div>
        </template>
    </UModal>
</template>
