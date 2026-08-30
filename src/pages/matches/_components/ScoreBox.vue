<script setup lang="ts">
    import { useToast } from '@nuxt/ui/composables/useToast';
    import type { Match } from '@/types';
    import { useStoreAuth } from '@/stores/authStore';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useI18n } from 'vue-i18n';
    import { computed, onMounted, ref } from 'vue';
    import { usePlayerStore } from '@/stores/playerStore';

    const props = defineProps<{
        match: Match;
        type: 'for' | 'against';
        reversed?: boolean;
    }>();

    const modal = defineModel<boolean>('visible');

    const authStore = useStoreAuth();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();
    const toast = useToast();
    const { t } = useI18n();

    const players = computed(() => matchStore.presentPlayersWithNames);

    const selectedPlayer = ref<string | null>(null);

    const updateGoals = async (delta: 1 | -1) => {
        if (!props.match?.id) return;

        const matchId = props.match.id;
        const currentGoals =
            props.type === 'for'
                ? (props.match.result?.goalsFor ?? 0)
                : (props.match.result?.goalsAgainst ?? 0);

        const newGoals = currentGoals + delta;

        if (newGoals < 0) return;

        await matchStore.updateMatchGoals(
            seasonStore.currentSeason,
            matchId,
            props.type,
            newGoals,
        );

        if (props.type === 'for') {
            modal.value = true;
        }

        if (delta > 0) {
            toast.add({
                title: t('common.goal'),
                description: t(`match.goalTypes.${props.type}`),
                color: 'info',
                duration: 20000,
            });
        }
    };

    const saveGoal = async () => {
        if (!props.match?.id || !selectedPlayer.value) return;

        const matchId = props.match.id;

        const appearance = matchStore.appearances.find(
            (player) =>
                player.present && player.playerId === selectedPlayer.value,
        );
        if (!appearance) return;

        await matchStore.incrementPlayerGoals(
            seasonStore.currentSeason,
            matchId,
            appearance.id,
            1,
        );

        modal.value = false;
        selectedPlayer.value = null;
    };

    onMounted(() => {
        if (!playerStore.playersLoaded) {
            playerStore.fetchPlayers();
        }
    });
</script>

<template>
    <div class="flex" :class="reversed ? 'flex-row' : 'flex-row-reverse'">
        <div
            v-if="
                authStore.user?.id &&
                seasonStore.isCurrentSeasonActive &&
                !match.ended
            "
            class="mx-6 flex flex-col justify-between gap-3"
        >
            <UButton
                color="neutral"
                icon="i-lucide-chevron-up"
                variant="ghost"
                @click="updateGoals(1)"
            />

            <UButton
                color="neutral"
                icon="i-lucide-chevron-down"
                variant="ghost"
                @click="updateGoals(-1)"
            />
        </div>

        <div
            class="flex size-24 items-center justify-center rounded bg-white text-4xl font-bold shadow sm:size-32 sm:text-6xl"
        >
            <template v-if="type === 'for'">
                {{ match?.result?.goalsFor }}
            </template>
            <template v-else>
                {{ match?.result?.goalsAgainst }}
            </template>
        </div>
    </div>

    <UModal
        v-model:open="modal"
        :title="t('match.goalScorer')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <USelect
                v-model="selectedPlayer"
                class="w-full"
                :items="players"
                label-key="playerName"
                :placeholder="t('player.selectPlayer')"
                value-key="playerId"
            />
        </template>

        <template #footer>
            <UButton
                icon="i-lucide-check"
                :label="t('common.save')"
                @click="saveGoal"
            />
        </template>
    </UModal>
</template>
