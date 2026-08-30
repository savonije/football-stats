<script setup lang="ts">
    import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue';
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AddTrainingDialog from '@/pages/training/_components/AddTrainingDialog.vue';
    import GenerateTrainingsDialog from '@/pages/training/_components/GenerateTrainingsDialog.vue';
    import TrainingDaysDialog from '@/pages/training/_components/TrainingDaysDialog.vue';
    import { useCanEdit } from '@/composables/useCanEdit';

    const { month } = defineProps<{ month: Date }>();

    const { t } = useI18n();
    const canEdit = useCanEdit();

    const addingTraining = ref(false);
    const generatingTrainings = ref(false);
    const editingTrainingDays = ref(false);

    const trainingMenuItems = computed<DropdownMenuItem[][]>(() => [
        [
            {
                label: t('training.add'),
                icon: 'i-lucide-plus',
                onSelect: () => (addingTraining.value = true),
            },
            {
                label: t('training.generate'),
                icon: 'i-lucide-calendar-plus',
                onSelect: () => (generatingTrainings.value = true),
            },
        ],
        [
            {
                label: t('training.trainingDays'),
                icon: 'i-lucide-settings',
                onSelect: () => (editingTrainingDays.value = true),
            },
        ],
    ]);
</script>

<template>
    <template v-if="canEdit">
        <UDropdownMenu :items="trainingMenuItems">
            <UButton
                color="neutral"
                icon="i-lucide-ellipsis-vertical"
                variant="subtle"
                :aria-label="t('common.moreOptions')"
            />
        </UDropdownMenu>

        <AddTrainingDialog v-model:visible="addingTraining" />

        <GenerateTrainingsDialog
            v-model:visible="generatingTrainings"
            :initial-month="month"
        />

        <TrainingDaysDialog v-model:visible="editingTrainingDays" />
    </template>
</template>
