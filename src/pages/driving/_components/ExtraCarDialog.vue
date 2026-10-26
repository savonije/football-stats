<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { DrivingPlan } from '@/utils/driving';

    const open = defineModel<boolean>('open');
    const { plan } = defineProps<{ plan: DrivingPlan }>();

    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const toast = useAppToast();
    const { t } = useI18n();

    const pick = ref<string | null>(null);
    const loading = ref(false);

    const nextName = computed(() => {
        const next = plan.next && playerStore.getPlayerById(plan.next);
        return next
            ? t('driving.addExtraCar.nextParent', { name: next.name })
            : t('driving.addExtraCar.nobody');
    });

    const parentOptions = computed(() => {
        const driving = new Set(plan.drivers);
        return playerStore
            .playersInSeason(seasonStore.currentSeason)
            .filter((player) => !driving.has(player.id))
            .map((player) => ({
                label: `${t('driving.parentOf')} ${player.name}`,
                value: player.id,
            }));
    });

    const save = async () => {
        const playerId = pick.value ?? plan.next;
        if (!playerId) return;

        loading.value = true;
        try {
            await matchStore.updateMatchDriving(
                seasonStore.currentSeason,
                plan.match.id,
                {
                    drivers: [...plan.drivers, playerId],
                    excluded: (plan.match.driving?.excluded ?? []).filter(
                        (id) => id !== playerId,
                    ),
                },
            );
            toast.success(t('common.changesSaved'));
            open.value = false;
        } finally {
            loading.value = false;
        }
    };
</script>

<template>
    <UModal
        v-model:open="open"
        :description="plan.match.opponent"
        :title="t('driving.addExtraCar.title')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <USelectMenu
                v-model="pick"
                class="w-full"
                :aria-label="t('driving.addExtraCar.title')"
                clear
                :items="parentOptions"
                :placeholder="t('driving.addExtraCar.pickPlaceholder')"
                size="lg"
                value-key="value"
            />

            <UAlert
                v-if="!pick"
                class="mt-3"
                color="info"
                :description="
                    t('driving.addExtraCar.autoHelp', { name: nextName })
                "
                icon="i-lucide-info"
                variant="subtle"
            />
        </template>

        <template #footer>
            <DialogFooter
                :confirm-label="t('common.add')"
                confirm-icon="i-lucide-plus"
                :disabled="!pick && !plan.next"
                :loading="loading"
                @cancel="open = false"
                @confirm="save"
            />
        </template>
    </UModal>
</template>
