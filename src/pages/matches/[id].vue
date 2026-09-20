<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';

    import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';
    import AddMatchPlayersDialog from '@/pages/matches/_components/AddMatchPlayersDialog.vue';
    import EditAppearanceDialog from '@/pages/matches/_components/EditAppearanceDialog.vue';
    import MatchControls from '@/pages/matches/_components/MatchControls.vue';
    import MatchHeader from '@/pages/matches/_components/MatchHeader.vue';
    import MatchTimer from '@/pages/matches/_components/MatchTimer.vue';
    import PlayerAppearanceItem from '@/pages/matches/_components/PlayerAppearanceItem.vue';
    import ScoreBoard from '@/pages/matches/_components/ScoreBoard.vue';

    import { useCanEdit } from '@/composables/useCanEdit';
    import { useConfirmOldMatchEdit } from '@/composables/useConfirmOldMatchEdit';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { AppearanceWithName } from '@/types';

    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const route = useRoute();
    const matchId = computed(() => route.params.id as string);
    const canEdit = useCanEdit();
    const confirmOldMatchEdit = useConfirmOldMatchEdit();

    const { t } = useI18n();
    const editingAppearanceId = ref<string | null>(null);
    const editingAppearance = ref(false);
    const addingPlayers = ref(false);

    const canAddPlayers = computed(
        () => canEdit.value && !matchStore.selectedMatch?.ended,
    );

    const noPlayersActions = computed(() =>
        canAddPlayers.value
            ? [
                  {
                      label: t('match.addPlayers'),
                      icon: 'i-lucide-user-plus',
                      color: 'warning' as const,
                      onClick: () => (addingPlayers.value = true),
                  },
              ]
            : [],
    );

    const selectedAppearance = computed(
        () =>
            matchStore.presentPlayersWithNames.find(
                (appearance) => appearance.id === editingAppearanceId.value,
            ) ?? null,
    );

    const openEditDialog = async (appearance: AppearanceWithName) => {
        if (!(await confirmOldMatchEdit(matchStore.selectedMatch))) return;

        editingAppearanceId.value = appearance.id;
        editingAppearance.value = true;
    };

    onMounted(() => {
        matchStore.fetchMatchDetails(seasonStore.currentSeason, matchId.value);
    });
</script>

<template>
    <AppBreadcrumb :label="matchStore.selectedMatch?.opponent" />

    <div v-if="matchStore.selectedMatch" class="mx-auto w-200 max-w-full">
        <MatchHeader
            :match="matchStore.selectedMatch"
            @add-players="addingPlayers = true"
        />

        <div
            class="shadow-card rounded-xl bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:rounded-none sm:bg-transparent sm:shadow-none"
        >
            <ScoreBoard
                class="sm:shadow-card sm:col-span-2 sm:rounded-xl sm:bg-white"
                :match="matchStore.selectedMatch"
            />

            <MatchTimer
                class="border-primary-100 sm:shadow-card border-t sm:rounded-xl sm:border-t-0 sm:bg-white"
            />
        </div>

        <MatchControls :season-id="seasonStore.currentSeason" />

        <div class="mt-8 mb-4 flex items-baseline justify-between gap-3">
            <h2 class="mb-0 text-xl">
                {{ t('player.player', 2) }}
            </h2>

            <span
                class="tracking-label text-primary-400 font-mono text-xs font-bold uppercase"
            >
                {{
                    t('match.playersPresent', {
                        count: matchStore.presentPlayersWithNames.length,
                    })
                }}
            </span>
        </div>

        <UAlert
            v-if="
                matchStore.appearancesLoaded &&
                !matchStore.presentPlayersWithNames.length
            "
            :actions="noPlayersActions"
            color="warning"
            :description="t('match.noPlayersAdded')"
            icon="i-lucide-triangle-alert"
            orientation="horizontal"
            variant="subtle"
        />

        <div class="space-y-3">
            <PlayerAppearanceItem
                v-for="appearance in matchStore.presentPlayersWithNames"
                :key="appearance.id"
                :appearance="appearance"
                :editable="canEdit"
                @edit="openEditDialog"
            />
        </div>

        <AddMatchPlayersDialog
            v-if="canAddPlayers"
            v-model:visible="addingPlayers"
            :match-id="matchId"
            :season-id="seasonStore.currentSeason"
        />

        <EditAppearanceDialog
            v-if="canEdit"
            v-model:visible="editingAppearance"
            :appearance="selectedAppearance"
            :season-id="seasonStore.currentSeason"
            :match-id="matchId"
        />
    </div>

    <div v-else-if="!matchStore.appearancesLoaded" class="flex justify-center">
        <ProgressSpinner />
    </div>
</template>
