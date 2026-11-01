<script setup lang="ts">
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { useConfirmDialog } from '@/composables/useConfirmDialog';
    import { useMatchStore } from '@/stores/matchStore';
    import { hasStarted } from '@/utils/match';

    const { seasonId } = defineProps<{ seasonId: string }>();

    const canEdit = useCanEdit();
    const confirm = useConfirmDialog();
    const matchStore = useMatchStore();
    const toast = useAppToast();
    const { t } = useI18n();

    const match = computed(() => matchStore.selectedMatch);
    const matchId = computed(() => match.value?.id);

    const started = computed(() => hasStarted(match.value));
    const isRunning = computed(() => started.value && !match.value?.paused);
    const isHalfTime = computed(() => !!match.value?.halfTime);
    const half = computed(() => match.value?.half ?? 1);

    const isPaused = computed(
        () => !!match.value?.paused && started.value && !isHalfTime.value,
    );

    const primary =
        'h-12 w-full justify-center rounded-xl bg-white text-base font-extrabold text-primary-900 hover:bg-primary-50';
    const secondary =
        'h-12 w-full justify-center rounded-xl border border-white/30 bg-white/10 text-base font-bold text-white hover:bg-white/20';

    const startMatch = () => {
        if (!matchId.value) return;
        matchStore.startMatch(seasonId, matchId.value);
    };

    const pauseMatch = () => {
        if (!matchId.value) return;
        matchStore.pauseMatch(seasonId, matchId.value);
    };

    const resumeMatch = () => {
        if (!matchId.value) return;
        matchStore.resumeMatch(seasonId, matchId.value);
    };

    const startSecondHalf = () => {
        if (!matchId.value) return;
        matchStore.startSecondHalf(seasonId, matchId.value);
    };

    const endFirstHalf = async () => {
        if (!matchId.value) return;

        const confirmed = await confirm({
            title: t('match.endFirstHalf'),
            message: t('match.endFirstHalfConfirm'),
            confirmLabel: t('match.endFirstHalf'),
        });

        if (!confirmed) return;

        await matchStore.endFirstHalf(seasonId, matchId.value);
        toast.success(t('match.messages.firstHalfEnded'));
    };

    const endMatch = async () => {
        if (!matchId.value) return;

        const confirmed = await confirm({
            title: t('match.endMatch'),
            message: t('match.endMatchConfirm'),
            confirmLabel: t('match.endMatch'),
        });

        if (!confirmed) return;

        await matchStore.endMatch(seasonId, matchId.value);
        toast.success(t('match.endMatchSuccess'));
    };
</script>

<template>
    <div
        v-if="canEdit && match && !match.ended"
        class="mt-5 grid gap-2.5"
        :class="{ 'grid-cols-2': isRunning }"
    >
        <UButton
            v-if="!started"
            :class="primary"
            color="neutral"
            icon="i-lucide-play"
            :label="t('match.controls.start')"
            @click="startMatch"
        />

        <UButton
            v-if="isPaused"
            :class="primary"
            color="neutral"
            icon="i-lucide-play"
            :label="t('common.resume')"
            @click="resumeMatch"
        />

        <UButton
            v-if="isHalfTime"
            :class="primary"
            color="neutral"
            icon="i-lucide-play"
            :label="t('match.controls.startSecondHalf')"
            @click="startSecondHalf"
        />

        <template v-if="isRunning">
            <UButton
                :class="secondary"
                color="neutral"
                icon="i-lucide-pause"
                :label="t('common.pause')"
                @click="pauseMatch"
            />

            <UButton
                v-if="half === 1"
                :class="primary"
                color="neutral"
                :label="t('match.controls.endFirstHalf')"
                @click="endFirstHalf"
            />

            <UButton
                v-else
                class="h-12 w-full justify-center rounded-xl text-base font-extrabold"
                color="error"
                :label="t('match.controls.endMatch')"
                @click="endMatch"
            />
        </template>
    </div>
</template>
