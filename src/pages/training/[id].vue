<script setup lang="ts">
    import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue';
    import dayjs from 'dayjs';
    import { computed, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRoute, useRouter } from 'vue-router';

    import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
    import ProgressSpinner from '@/components/ui/ProgressSpinner.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { useConfirmDialog } from '@/composables/useConfirmDialog';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useTrainingStore } from '@/stores/trainingStore';
    import { isGuestInSeason } from '@/utils/playerSeason';
    import { attendanceStatus, type AttendanceStatus } from '@/utils/training';

    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();
    const toast = useAppToast();
    const confirm = useConfirmDialog();

    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const playerStore = usePlayerStore();

    const trainingId = computed(() => route.params.id as string);

    const canEdit = useCanEdit();

    const training = computed(() => trainingStore.selectedTraining);
    const isCancelled = computed(() => training.value?.cancelled === true);

    const dateLabel = computed(() =>
        training.value?.date
            ? dayjs(training.value.date.toDate()).format('D MMMM YYYY')
            : '',
    );

    const weekday = computed(() =>
        training.value?.date
            ? dayjs(training.value.date.toDate()).format('dddd')
            : '',
    );

    const attendees = computed(() => {
        const current = training.value;

        return playerStore
            .playersInSeason(seasonStore.currentSeason)
            .filter((p) => !isGuestInSeason(p, seasonStore.currentSeason))
            .map((p) => ({
                id: p.id,
                playerName: p.name,
                status: current
                    ? attendanceStatus(p.id, current)
                    : ('unmarked' as AttendanceStatus),
            }));
    });

    const presentCount = computed(
        () => attendees.value.filter((a) => a.status === 'present').length,
    );

    const cardClasses: Record<AttendanceStatus, string> = {
        present: 'border-green-500 bg-green-50',
        absent: 'border-red-400 bg-red-50',
        unmarked: 'border-gray-300 bg-gray-50',
    };

    const nameClasses: Record<AttendanceStatus, string> = {
        present: 'text-green-900',
        absent: 'text-red-900',
        unmarked: 'text-gray-500',
    };

    const setStatus = (playerId: string, status: AttendanceStatus) => {
        trainingStore.setPlayerAttendance(
            seasonStore.currentSeason,
            trainingId.value,
            playerId,
            status,
        );
    };

    const togglePresent = (playerId: string, present: boolean) =>
        setStatus(playerId, present ? 'present' : 'absent');

    const cancelTraining = async () => {
        await trainingStore.setTrainingCancelled(
            seasonStore.currentSeason,
            trainingId.value,
            true,
        );

        toast.success(t('training.messages.cancelledSaved'));
    };

    const uncancelTraining = async () => {
        await trainingStore.setTrainingCancelled(
            seasonStore.currentSeason,
            trainingId.value,
            false,
        );

        toast.success(t('training.messages.uncancelledSaved'));
    };

    const confirmDelete = async () => {
        const confirmed = await confirm({
            title: t('training.deleteTraining'),
            message: t('training.deleteTrainingConfirm'),
            confirmLabel: t('common.delete'),
            confirmColor: 'error',
        });

        if (!confirmed) return;

        await trainingStore.deleteTraining(
            seasonStore.currentSeason,
            trainingId.value,
        );

        toast.success(t('common.changesSaved'));

        router.push({ name: 'training' });
    };

    const menuItems = computed<DropdownMenuItem[][]>(() => [
        [
            isCancelled.value
                ? {
                      label: t('training.uncancel'),
                      icon: 'i-lucide-undo-2',
                      onSelect: uncancelTraining,
                  }
                : {
                      label: t('training.cancel'),
                      icon: 'i-lucide-ban',
                      onSelect: cancelTraining,
                  },
        ],
        [
            {
                label: t('training.deleteTraining'),
                icon: 'i-lucide-trash',
                color: 'error' as const,
                onSelect: confirmDelete,
            },
        ],
    ]);

    onMounted(() => {
        playerStore.fetchPlayers();

        trainingStore.fetchTrainingDetails(
            seasonStore.currentSeason,
            trainingId.value,
        );
    });
</script>

<template>
    <AppBreadcrumb :label="dateLabel || undefined" />

    <div v-if="training" class="mx-auto w-200 max-w-full sm:p-4">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="mb-1 text-2xl font-bold capitalize">
                    {{ weekday }} {{ dateLabel }}
                </h1>
                <p class="text-primary-400 text-sm font-medium">
                    {{
                        t('training.presentCount', {
                            present: presentCount,
                            total: attendees.length,
                        })
                    }}
                </p>
            </div>

            <div class="flex items-center gap-3">
                <UBadge
                    v-if="isCancelled"
                    color="error"
                    icon="i-lucide-ban"
                    variant="subtle"
                >
                    {{ t('training.cancelled') }}
                </UBadge>

                <UDropdownMenu v-if="canEdit" :items="menuItems">
                    <UButton
                        color="neutral"
                        icon="i-lucide-ellipsis-vertical"
                        variant="subtle"
                        :aria-label="t('common.moreOptions')"
                    />
                </UDropdownMenu>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div
                v-for="attendee in attendees"
                :key="attendee.id"
                class="shadow-card flex items-center justify-between gap-3 rounded-xl border-l-4 px-4 py-3"
                :class="[
                    cardClasses[attendee.status],
                    { 'opacity-30': isCancelled },
                ]"
            >
                <div>
                    <span
                        class="font-medium"
                        :class="nameClasses[attendee.status]"
                    >
                        {{ attendee.playerName }}
                    </span>
                    <span
                        v-if="attendee.status === 'unmarked'"
                        class="text-xxs tracking-label block font-mono text-gray-400 uppercase"
                    >
                        {{ t('training.unmarked') }}
                    </span>
                </div>

                <div v-if="canEdit && !isCancelled" class="flex items-center">
                    <USwitch
                        :aria-label="attendee.playerName"
                        :model-value="attendee.status === 'present'"
                        @update:model-value="togglePresent(attendee.id, $event)"
                    />
                </div>
            </div>
        </div>
    </div>

    <div
        v-else-if="!trainingStore.selectedTrainingLoaded"
        class="justify-content-center flex"
    >
        <ProgressSpinner />
    </div>
</template>
