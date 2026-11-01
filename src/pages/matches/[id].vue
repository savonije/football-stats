<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';

    import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';
    import AddMatchPlayersDialog from '@/pages/matches/_components/AddMatchPlayersDialog.vue';
    import EditAppearanceDialog from '@/pages/matches/_components/EditAppearanceDialog.vue';
    import GoalBanner from '@/pages/matches/_components/GoalBanner.vue';
    import GoalTimeline from '@/pages/matches/_components/GoalTimeline.vue';
    import MatchActionsMenu from '@/pages/matches/_components/MatchActionsMenu.vue';
    import MatchHero from '@/pages/matches/_components/MatchHero.vue';
    import MatchInfoCard from '@/pages/matches/_components/MatchInfoCard.vue';
    import PlayerAppearanceItem from '@/pages/matches/_components/PlayerAppearanceItem.vue';

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
    <div class="flex items-start justify-between gap-3">
        <AppBreadcrumb :label="matchStore.selectedMatch?.opponent" />

        <div v-if="matchStore.selectedMatch" class="-mt-2">
            <MatchActionsMenu
                :match="matchStore.selectedMatch"
                @add-players="addingPlayers = true"
            />
        </div>
    </div>

    <div v-if="matchStore.selectedMatch" class="mx-auto w-200 max-w-full">
        <MatchHero
            :match="matchStore.selectedMatch"
            :season-id="seasonStore.currentSeason"
        />

        <GoalBanner :match="matchStore.selectedMatch" />

        <GoalTimeline :match="matchStore.selectedMatch" />

        <MatchInfoCard :match="matchStore.selectedMatch" />

        <div class="mt-8 mb-4 flex items-baseline justify-between gap-3">
            <h2 class="mb-0 text-xl">
                {{ t('player.player', 2) }}
            </h2>

            <span class="text-primary-500 text-sm font-medium">
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
