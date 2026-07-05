<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useI18n } from 'vue-i18n';
    import dayjs from 'dayjs';
    import {
        Button,
        Select,
        Tag,
        ToggleSwitch,
        useConfirm,
    } from 'primevue';
    import { useToast } from 'primevue/usetoast';

    import { useTrainingStore } from '@/stores/trainingStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useStoreAuth } from '@/stores/authStore';
    import { TOAST_LIFE } from '@/constants';

    import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
    import ProgressSpinner from '@/components/ProgressSpinner.vue';

    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();
    const toast = useToast();
    const confirm = useConfirm();

    const trainingStore = useTrainingStore();
    const seasonStore = useSeasonStore();
    const authStore = useStoreAuth();

    const trainingId = computed(() => route.params.id as string);

    const canEdit = computed(
        () => !!authStore.user?.id && seasonStore.isCurrentSeasonActive,
    );

    const training = computed(() => trainingStore.selectedTraining);
    const isCancelled = computed(() => training.value?.cancelled === true);

    const dateLabel = computed(() =>
        training.value?.date
            ? dayjs(training.value.date.toDate()).format('D MMMM YYYY')
            : '',
    );

    const attendees = computed(() => trainingStore.attendeesWithNames);

    const reasonOptions = computed(() => [
        { label: t('training.reasons.weather'), value: t('training.reasons.weather') },
        { label: t('training.reasons.noTrainer'), value: t('training.reasons.noTrainer') },
        { label: t('training.reasons.other'), value: t('training.reasons.other') },
    ]);

    const cancelReason = ref<string>('');

    watch(
        reasonOptions,
        (options) => {
            if (!cancelReason.value && options.length) {
                cancelReason.value = options[0]!.value;
            }
        },
        { immediate: true },
    );

    const togglePresent = (attendanceId: string, present: boolean) => {
        trainingStore.setAttendancePresent(
            seasonStore.currentSeason,
            trainingId.value,
            attendanceId,
            present,
        );
    };

    const cancelTraining = async () => {
        await trainingStore.setTrainingCancelled(
            seasonStore.currentSeason,
            trainingId.value,
            true,
            cancelReason.value,
        );
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('training.messages.cancelledSaved'),
            life: TOAST_LIFE,
        });
    };

    const uncancelTraining = async () => {
        await trainingStore.setTrainingCancelled(
            seasonStore.currentSeason,
            trainingId.value,
            false,
        );
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('training.messages.uncancelledSaved'),
            life: TOAST_LIFE,
        });
    };

    const confirmDelete = async () => {
        await trainingStore.deleteTraining(
            seasonStore.currentSeason,
            trainingId.value,
        );
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('common.changesSaved'),
            life: TOAST_LIFE,
        });
        router.push({ name: 'training' });
    };

    onMounted(() => {
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
                    {{ dateLabel }}
                </h1>
                <p class="text-primary-400 text-sm font-medium">
                    {{
                        t('training.presentCount', {
                            present: trainingStore.presentCount,
                            total: attendees.length,
                        })
                    }}
                </p>
            </div>

            <Tag
                v-if="isCancelled"
                severity="danger"
                icon="pi pi-ban"
                :value="
                    training.cancelledReason || t('training.cancelled')
                "
            />
        </div>

        <!-- Cancel / uncancel controls -->
        <div
            v-if="canEdit"
            class="mb-6 flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3"
        >
            <template v-if="!isCancelled">
                <Select
                    v-model="cancelReason"
                    :options="reasonOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    class="w-48"
                    :aria-label="t('training.cancelReason')"
                    editable
                />
                <Button
                    :label="t('training.cancel')"
                    icon="pi pi-ban"
                    severity="danger"
                    variant="outlined"
                    size="small"
                    @click="cancelTraining"
                />
            </template>
            <Button
                v-else
                :label="t('training.uncancel')"
                icon="pi pi-undo"
                severity="secondary"
                size="small"
                @click="uncancelTraining"
            />
        </div>

        <!-- Presence checklist -->
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div
                v-for="attendee in attendees"
                :key="attendee.id"
                class="shadow-card flex items-center justify-between rounded-xl bg-white px-4 py-3"
                :class="{ 'opacity-60': isCancelled }"
            >
                <span class="font-medium">{{ attendee.playerName }}</span>
                <ToggleSwitch
                    :model-value="attendee.present"
                    :disabled="!canEdit || isCancelled"
                    @update:model-value="togglePresent(attendee.id, $event)"
                />
            </div>
        </div>

        <div
            v-if="canEdit"
            class="mt-12 flex justify-between gap-6"
        >
            <Button
                :label="t('common.delete')"
                severity="danger"
                icon="pi pi-trash"
                variant="outlined"
                @click="
                    confirm.require({
                        message: t('training.title'),
                        header: t('common.delete'),
                        icon: 'pi pi-exclamation-triangle',
                        rejectLabel: t('common.cancel'),
                        acceptLabel: t('common.delete'),
                        acceptClass: 'p-button-danger',
                        accept: confirmDelete,
                    })
                "
            />
        </div>
    </div>

    <div
        v-else-if="!trainingStore.attendancesLoaded"
        class="justify-content-center flex"
    >
        <ProgressSpinner />
    </div>
</template>
