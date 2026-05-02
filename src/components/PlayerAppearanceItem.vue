<script setup lang="ts">
    import {
        InputNumber,
        Checkbox,
        Button,
        Skeleton,
        useConfirm,
    } from 'primevue';
    import type { Appearance } from '@/types';
    import { useI18n } from 'vue-i18n';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useRoute } from 'vue-router';

    type AppearanceWithName = Appearance & { playerName: string };

    const props = defineProps<{
        editing: boolean;
    }>();

    const { t } = useI18n();
    const confirm = useConfirm();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const route = useRoute();
    const matchId = route.params.id as string;

    const appearance = defineModel<AppearanceWithName>('appearance');

    const handleDelete = () => {
        if (!appearance.value) return;

        confirm.require({
            message: t('player.deletePlayerConfirm', [
                appearance.value.playerName,
            ]),
            header: t('player.deletePlayer'),
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: t('common.cancel'),
            acceptLabel: t('common.delete'),
            acceptClass: 'p-button-danger',
            accept: async () => {
                await matchStore.deleteAppearance(
                    seasonStore.currentSeason,
                    matchId,
                    appearance.value!.id,
                );
            },
        });
    };
</script>

<template>
    <div
        v-if="appearance && appearance.playerName"
        :class="{
            'flex min-h-18 items-center justify-between rounded bg-white p-4 shadow': true,
            'flex-col items-start gap-2 md:flex-row': editing,
        }"
    >
        <div class="flex flex-col">
            <router-link
                class="text-primary font-medium"
                :to="{
                    name: 'playerDetail',
                    params: { id: appearance.playerId },
                }"
            >
                {{ appearance.playerName }}
            </router-link>
        </div>

        <Transition name="fade" mode="out-in">
            <div v-if="!props.editing" class="flex items-center gap-4 text-2xl">
                <span v-if="appearance.goals && appearance.goals > 0">
                    <span v-for="n in appearance.goals" :key="n">⚽</span>
                </span>
                <span v-if="appearance.isGoalkeeper">🧤</span>
            </div>

            <div v-else class="flex flex-col gap-6 md:flex-row md:items-center">
                <div class="flex items-center gap-3">
                    <label for="goals">{{ $t('common.goal', 2) }}</label>
                    <InputNumber
                        v-model.number="appearance.goals"
                        input-id="goals"
                        :min="0"
                        show-buttons
                        size="small"
                    />
                </div>

                <div class="flex items-center gap-3">
                    <label for="isGoalkeeper">{{
                        $t('player.wasKeeper')
                    }}</label>
                    <Checkbox
                        v-model="appearance.isGoalkeeper"
                        name="isGoalkeeper"
                        input-id="isGoalkeeper"
                        binary
                    />
                </div>

                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    :aria-label="$t('player.deletePlayer')"
                    size="small"
                    @click="handleDelete"
                />
            </div>
        </Transition>
    </div>
    <div v-else>
        <Skeleton width="100%" height="4rem" />
    </div>
</template>
