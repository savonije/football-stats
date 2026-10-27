<script setup lang="ts">
    import { computed, onMounted, watch } from 'vue';

    import HiddenPageAlert from '@/components/ui/HiddenPageAlert.vue';
    import DrivingActionsMenu from '@/pages/driving/_components/DrivingActionsMenu.vue';
    import DrivingCounts from '@/pages/driving/_components/DrivingCounts.vue';
    import DrivingSchedule from '@/pages/driving/_components/DrivingSchedule.vue';

    import { useCanEdit } from '@/composables/useCanEdit';
    import { useIsAdmin } from '@/composables/useIsAdmin';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useSettingsStore } from '@/stores/settingsStore';
    import { planDriving } from '@/utils/driving';

    const playerStore = usePlayerStore();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const settingsStore = useSettingsStore();
    const isAdmin = useIsAdmin();
    const canEdit = useCanEdit();

    const loading = computed(
        () =>
            !playerStore.playersLoaded ||
            !matchStore.matchesLoaded ||
            !matchStore.appearancesLoaded,
    );

    const plan = computed(() =>
        planDriving(
            matchStore.matches,
            matchStore.appearances,
            playerStore.players,
            seasonStore.currentSeason,
            settingsStore.playersPerCar,
        ),
    );

    watch(
        [plan, loading, canEdit, () => settingsStore.drivingEnabled],
        () => {
            if (loading.value || !canEdit.value) return;
            if (!settingsStore.drivingEnabled) return;

            for (const { match, saved, drivers } of plan.value.plans) {
                if (saved) continue;
                matchStore.updateMatchDriving(
                    seasonStore.currentSeason,
                    match.id,
                    { drivers },
                );
            }
        },
        { immediate: true },
    );

    onMounted(() => {
        playerStore.fetchPlayers();
        matchStore.fetchMatches(seasonStore.currentSeason);
        matchStore.fetchAppearances(seasonStore.currentSeason);
    });

    watch(
        () => seasonStore.currentSeason,
        (seasonId) => {
            matchStore.fetchMatches(seasonId);
            matchStore.fetchAppearances(seasonId);
        },
    );
</script>

<template>
    <HiddenPageAlert
        v-if="!settingsStore.drivingEnabled"
        hidden
        title="settings.drivingHidden"
    />

    <template v-else>
        <div class="mb-6 flex items-start justify-between gap-4">
            <p class="text-primary-800 mb-0 max-w-2xl">
                {{ $t('driving.intro', settingsStore.playersPerCar) }}
            </p>
            <DrivingActionsMenu />
        </div>

        <DrivingSchedule :loading="loading" :plans="plan.plans" />

        <DrivingCounts
            v-if="isAdmin"
            :counts="plan.counts"
            :loading="loading"
        />
    </template>
</template>
