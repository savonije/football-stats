<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { TOAST_LIFE } from '@/constants';
    import { useRoute, useRouter } from 'vue-router';
    import { Button, useConfirm } from 'primevue';
    import { useToast } from 'primevue/usetoast';

    import AddMatchPlayersDialog from '@/pages/matches/_components/AddMatchPlayersDialog.vue';
    import EditAppearanceDialog from '@/pages/matches/_components/EditAppearanceDialog.vue';
    import MatchHeader from '@/pages/matches/_components/MatchHeader.vue';
    import PlayerAppearanceItem from '@/pages/matches/_components/PlayerAppearanceItem.vue';
    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';
    import MatchTimer from '@/pages/matches/_components/MatchTimer.vue';
    import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
    import type { AppearanceWithName } from '@/types';
    import { useI18n } from 'vue-i18n';

    const toast = useToast();
    const router = useRouter();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const route = useRoute();
    const matchId = computed(() => route.params.id as string);
    const confirm = useConfirm();
    const canEdit = useCanEdit();

    const { t } = useI18n();
    const addingPlayers = ref(false);
    const editingAppearanceId = ref<string | null>(null);
    const editingAppearance = ref(false);

    const appearancesWithName = computed(
        () => matchStore.presentPlayersWithNames,
    );

    const canEditAppearances = computed(
        () => canEdit.value && !matchStore.selectedMatch?.ended,
    );

    const selectedAppearance = computed(
        () =>
            appearancesWithName.value.find(
                (appearance) => appearance.id === editingAppearanceId.value,
            ) ?? null,
    );

    const openEditDialog = (appearance: AppearanceWithName) => {
        editingAppearanceId.value = appearance.id;
        editingAppearance.value = true;
    };

    const confirmDeleteMatch = async () => {
        await matchStore.deleteMatch(seasonStore.currentSeason, matchId.value);

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('match.deleteMatchSuccess'),
            life: TOAST_LIFE,
        });

        router.push({ name: 'home' });
    };

    onMounted(() => {
        matchStore.fetchMatchDetails(seasonStore.currentSeason, matchId.value);
    });
</script>

<template>
    <AppBreadcrumb :label="matchStore.selectedMatch?.opponent" />

    <div
        v-if="matchStore.selectedMatch"
        class="mx-auto w-200 max-w-full sm:p-4"
    >
        <MatchHeader :match="matchStore.selectedMatch" />

        <MatchTimer :season-id="seasonStore.currentSeason" />

        <div class="mb-4 flex items-center justify-between">
            <h2 class="mb-2 text-xl font-semibold">
                {{ t('player.player', 2) }}
            </h2>
        </div>

        <div class="space-y-4">
            <PlayerAppearanceItem
                v-for="appearance in appearancesWithName"
                :key="appearance.id"
                :appearance="appearance"
                :editable="canEditAppearances"
                @edit="openEditDialog"
            />
        </div>

        <template v-if="canEditAppearances">
            <AddMatchPlayersDialog
                v-model:visible="addingPlayers"
                :season-id="seasonStore.currentSeason"
                :match-id="matchId"
            />

            <EditAppearanceDialog
                v-model:visible="editingAppearance"
                :appearance="selectedAppearance"
                :season-id="seasonStore.currentSeason"
                :match-id="matchId"
            />
        </template>

        <div v-if="canEdit" class="mt-12 flex justify-between gap-6">
            <Button
                v-if="canEditAppearances"
                :label="t('match.addPlayers')"
                icon="pi pi-user-plus"
                size="small"
                @click="addingPlayers = true"
            />

            <Button
                :label="t('match.deleteMatch')"
                severity="danger"
                icon="pi pi-trash"
                variant="outlined"
                @click="
                    confirm.require({
                        message: t('match.deleteMatchConfirm'),
                        header: t('match.deleteMatch'),
                        icon: 'pi pi-exclamation-triangle',
                        rejectLabel: t('common.cancel'),
                        acceptLabel: t('common.delete'),
                        acceptClass: 'p-button-danger',
                        accept: confirmDeleteMatch,
                    })
                "
            />
        </div>
    </div>

    <div
        v-else-if="!matchStore.appearancesLoaded"
        class="justify-content-center flex"
    >
        <ProgressSpinner />
    </div>
</template>
