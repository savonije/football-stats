<script setup lang="ts">
    import dayjs from 'dayjs';
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import {
        fetchKnvbMatches,
        fetchSeasonMatches,
    } from '@/services/knvbService';
    import { addMatch } from '@/services/matchService';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useSettingsStore } from '@/stores/settingsStore';
    import {
        reconcileKnvbMatches,
        type KnvbMatch,
        type KnvbWarning,
    } from '@/utils/knvb';
    import { isGuestInSeason } from '@/utils/playerSeason';

    const model = defineModel<boolean>('visible');

    const { t } = useI18n();
    const toast = useAppToast();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const settingsStore = useSettingsStore();

    const fetching = ref(false);
    const saving = ref(false);
    const error = ref('');
    const toAdd = ref<KnvbMatch[]>([]);
    const warnings = ref<KnvbWarning[]>([]);

    const formatDate = (date: Date) => dayjs(date).format('DD-MM-YYYY HH:mm');

    const warningText = ({ match, knvb, field }: KnvbWarning) => {
        const ours = match.date.toDate();
        const [oursText, knvbText] =
            field === 'opponent'
                ? [match.opponent, knvb.opponent]
                : field === 'time'
                  ? [
                        dayjs(ours).format('HH:mm'),
                        dayjs(knvb.date).format('HH:mm'),
                    ]
                  : [formatDate(ours), formatDate(knvb.date)];
        return t(`knvbImport.warning.${field}`, {
            ours: oursText,
            knvb: knvbText,
        });
    };

    const load = async () => {
        fetching.value = true;
        error.value = '';
        toAdd.value = [];
        warnings.value = [];
        if (!playerStore.playersLoaded) playerStore.fetchPlayers();
        try {
            const [knvbMatches, existing] = await Promise.all([
                fetchKnvbMatches(
                    settingsStore.sportlinkClientId,
                    seasonStore.currentTeamName,
                ),
                fetchSeasonMatches(seasonStore.currentSeason),
            ]);
            if (!knvbMatches) {
                error.value = t('knvbImport.teamNotFound', {
                    team: seasonStore.currentTeamName,
                });
                return;
            }
            ({ toAdd: toAdd.value, warnings: warnings.value } =
                reconcileKnvbMatches(existing, knvbMatches));
        } catch (err) {
            console.error(err);
            error.value = t('knvbImport.fetchError');
        } finally {
            fetching.value = false;
        }
    };

    const closeDialog = () => (model.value = false);

    const importMatches = async () => {
        const seasonId = seasonStore.currentSeason;
        const playerIds = playerStore
            .playersInSeason(seasonId)
            .filter((player) => !isGuestInSeason(player, seasonId))
            .map((player) => player.id);

        saving.value = true;
        try {
            for (const match of toAdd.value) {
                await addMatch(seasonId, {
                    opponent: match.opponent,
                    date: match.date,
                    home: match.home,
                    knvbCode: match.code,
                    playerIds,
                });
            }
            toast.success(
                t('knvbImport.matchesImported', {
                    count: toAdd.value.length,
                }),
            );
            closeDialog();
        } catch (err) {
            console.error(err);
            toast.error(t('match.messages.matchAddError'));
        } finally {
            saving.value = false;
        }
    };

    watch(model, (visible) => {
        if (visible) load();
    });
</script>

<template>
    <UModal
        v-model:open="model"
        :title="t('knvbImport.syncSchedule')"
        :ui="{ content: 'w-lg' }"
    >
        <template #body>
            <div class="flex flex-col gap-4">
                <p v-if="fetching" class="text-sm text-gray-500">
                    {{ t('knvbImport.loading') }}
                </p>

                <UAlert
                    v-else-if="error"
                    color="error"
                    :description="error"
                    variant="subtle"
                />

                <template v-else>
                    <p class="text-primary-500 text-sm font-medium">
                        {{
                            toAdd.length
                                ? t('knvbImport.newMatches', {
                                      count: toAdd.length,
                                  })
                                : t('knvbImport.allExist')
                        }}
                    </p>

                    <ul
                        v-if="toAdd.length"
                        class="flex flex-col gap-1 text-sm"
                        data-testid="knvb-new-matches"
                    >
                        <li
                            v-for="match in toAdd"
                            :key="match.code"
                            class="flex gap-2"
                        >
                            <span class="text-gray-500 tabular-nums">
                                {{ formatDate(match.date) }}
                            </span>
                            <span class="font-semibold">
                                {{ match.opponent }}
                            </span>
                            <span class="ml-auto text-gray-500">
                                {{
                                    match.home
                                        ? t('common.home')
                                        : t('common.away')
                                }}
                            </span>
                        </li>
                    </ul>

                    <UAlert
                        v-if="warnings.length"
                        color="warning"
                        :title="t('knvbImport.warningsTitle')"
                        variant="subtle"
                        data-testid="knvb-warnings"
                    >
                        <template #description>
                            <ul class="flex flex-col gap-1">
                                <li
                                    v-for="warning in warnings"
                                    :key="`${warning.match.id}-${warning.field}`"
                                >
                                    {{ warningText(warning) }}
                                </li>
                            </ul>
                        </template>
                    </UAlert>
                </template>
            </div>
        </template>

        <template #footer>
            <DialogFooter
                :confirm-label="$t('common.add')"
                confirm-icon="i-lucide-check"
                :disabled="
                    fetching || !toAdd.length || !playerStore.playersLoaded
                "
                :loading="saving"
                @cancel="closeDialog"
                @confirm="importMatches"
            />
        </template>
    </UModal>
</template>
