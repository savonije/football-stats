<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Button, Menu } from 'primevue';
    import type { MenuItem } from 'primevue/menuitem';
    import { useI18n } from 'vue-i18n';

    import AddTrainingDialog from '@/pages/training/_components/AddTrainingDialog.vue';
    import GenerateTrainingsDialog from '@/pages/training/_components/GenerateTrainingsDialog.vue';
    import TrainingDaysDialog from '@/pages/training/_components/TrainingDaysDialog.vue';
    import { useCanEdit } from '@/composables/useCanEdit';

    const { month } = defineProps<{ month: Date }>();

    const { t } = useI18n();
    const canEdit = useCanEdit();

    const trainingMenu = ref<InstanceType<typeof Menu> | null>(null);
    const addingTraining = ref(false);
    const generatingTrainings = ref(false);
    const editingTrainingDays = ref(false);

    const trainingMenuItems = computed<MenuItem[]>(() => [
        {
            label: t('training.add'),
            icon: 'pi pi-plus',
            command: () => (addingTraining.value = true),
        },
        {
            label: t('training.generate'),
            icon: 'pi pi-calendar-plus',
            command: () => (generatingTrainings.value = true),
        },
        { separator: true },
        {
            label: t('training.trainingDays'),
            icon: 'pi pi-cog',
            command: () => (editingTrainingDays.value = true),
        },
    ]);
</script>

<template>
    <template v-if="canEdit">
        <Button
            severity="secondary"
            icon="pi pi-ellipsis-v"
            :aria-label="t('common.moreOptions')"
            aria-haspopup="true"
            aria-controls="training-menu"
            @click="trainingMenu?.toggle($event)"
        />

        <Menu
            id="training-menu"
            ref="trainingMenu"
            :model="trainingMenuItems"
            popup
        >
            <template #item="{ item, props }">
                <a class="flex items-center gap-2" v-bind="props.action">
                    <span class="flex items-center gap-2">
                        <span :class="item.icon" />
                        {{ item.label }}
                    </span>
                </a>
            </template>
        </Menu>

        <AddTrainingDialog v-model:visible="addingTraining" />

        <GenerateTrainingsDialog
            v-model:visible="generatingTrainings"
            :initial-month="month"
        />

        <TrainingDaysDialog v-model:visible="editingTrainingDays" />
    </template>
</template>
