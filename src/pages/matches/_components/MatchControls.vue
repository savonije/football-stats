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
    const isRunning = computed(() => !!match.value?.running);
    const isHalfTime = computed(() => !!match.value?.halfTime);
    const half = computed(() => match.value?.half ?? 1);

    const isPaused = computed(
        () => !!match.value?.paused && started.value && !isHalfTime.value,
    );

    const statusLabel = computed(() => {
        if (!started.value) return t('match.readyToKickOff');
        if (isHalfTime.value) return t('match.halfTime');
        if (isPaused.value) return t('match.isPaused');

        return t('match.running');
    });

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
        class="shadow-card mt-4 flex flex-col gap-2.5 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
        <div
            class="tracking-label text-primary-400 hidden text-xs font-bold uppercase sm:block"
        >
            {{ statusLabel }}
        </div>

        <div class="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center">
            <UButton
                v-if="isRunning"
                class="w-full justify-center sm:w-auto"
                color="neutral"
                icon="i-lucide-pause"
                :label="t('common.pause')"
                variant="outline"
                @click="pauseMatch"
            />

            <UButton
                v-if="!started"
                class="w-full justify-center sm:w-auto"
                color="success"
                icon="i-lucide-play"
                :label="t('common.start')"
                @click="startMatch"
            />

            <UButton
                v-if="isPaused"
                class="w-full justify-center sm:w-auto"
                color="success"
                icon="i-lucide-play"
                :label="t('common.resume')"
                @click="resumeMatch"
            />

            <UButton
                v-if="isRunning && half === 1"
                class="w-full justify-center sm:w-auto"
                color="warning"
                icon="i-lucide-flag"
                :label="t('match.endFirstHalf')"
                @click="endFirstHalf"
            />

            <UButton
                v-if="isHalfTime"
                class="w-full justify-center sm:w-auto"
                color="success"
                icon="i-lucide-play"
                :label="t('match.startSecondHalf')"
                @click="startSecondHalf"
            />

            <UButton
                v-if="isRunning && half === 2"
                class="w-full justify-center sm:w-auto"
                color="error"
                icon="i-lucide-flag"
                :label="t('match.endMatch')"
                @click="endMatch"
            />
        </div>
    </div>
</template>
