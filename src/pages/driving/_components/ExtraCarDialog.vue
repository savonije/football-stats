<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Match } from '@/types';
    import type { DrivingPlan } from '@/utils/driving';

    const open = defineModel<boolean>('open');
    const { match, plan } = defineProps<{
        match: Match;
        plan: DrivingPlan;
    }>();

    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const toast = useAppToast();
    const { t } = useI18n();

    const mode = ref<'auto' | 'pick'>('auto');
    const pick = ref<string | undefined>();
    const loading = ref(false);

    const nextName = computed(() => {
        const next = plan.next && playerStore.getPlayerById(plan.next);
        return next
            ? t('driving.addExtraCar.nextParent', { name: next.name })
            : t('driving.addExtraCar.nobody');
    });

    const modeOptions = computed(() => [
        {
            label: t('driving.addExtraCar.auto'),
            description: t('driving.addExtraCar.autoHelp', {
                name: nextName.value,
            }),
            value: 'auto',
        },
        {
            label: t('driving.addExtraCar.pick'),
            description: t('driving.addExtraCar.pickHelp'),
            value: 'pick',
        },
    ]);

    const parentOptions = computed(() => {
        const driving = new Set(plan.cars.map((car) => car.playerId));
        return playerStore
            .playersInSeason(seasonStore.currentSeason)
            .filter((player) => !driving.has(player.id))
            .map((player) => ({
                label: `${t('driving.parentOf')} ${player.name}`,
                value: player.id,
            }));
    });

    watch(pick, (value) => {
        if (value) mode.value = 'pick';
    });

    watch(
        open,
        (isOpen) => {
            if (!isOpen) return;
            mode.value = 'auto';
            pick.value = undefined;
        },
        { immediate: true },
    );

    const save = async () => {
        const playerId = mode.value === 'pick' ? (pick.value ?? null) : null;
        if (mode.value === 'pick' && !playerId) return;

        loading.value = true;
        try {
            await matchStore.updateMatchDriving(
                seasonStore.currentSeason,
                match.id,
                {
                    extraCars: [...(match.driving?.extraCars ?? []), playerId],
                    excluded: (match.driving?.excluded ?? []).filter(
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
        :description="match.opponent"
        :title="t('driving.addExtraCar.title')"
        :ui="{ content: 'w-md' }"
    >
        <template #body>
            <URadioGroup v-model="mode" :items="modeOptions" variant="card" />

            <USelectMenu
                v-model="pick"
                class="mt-3 w-full"
                :aria-label="t('driving.addExtraCar.pick')"
                :items="parentOptions"
                :placeholder="t('driving.addExtraCar.pickPlaceholder')"
                size="lg"
                value-key="value"
                data-testid="extra-car-parent"
            />
        </template>

        <template #footer>
            <DialogFooter
                :confirm-label="t('common.add')"
                confirm-icon="i-lucide-plus"
                :disabled="mode === 'pick' && !pick"
                :loading="loading"
                @cancel="open = false"
                @confirm="save"
            />
        </template>
    </UModal>
</template>
