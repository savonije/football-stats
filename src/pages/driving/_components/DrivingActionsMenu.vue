<script setup lang="ts">
    import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue';
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import SettingsDialog from '@/pages/driving/_components/SettingsDialog.vue';

    import { useCanEdit } from '@/composables/useCanEdit';

    const { t } = useI18n();
    const canEdit = useCanEdit();

    const editingSettings = ref(false);

    const drivingMenuItems = computed<DropdownMenuItem[][]>(() => [
        [
            {
                label: t('driving.playersPerCar'),
                icon: 'i-lucide-settings',
                onSelect: () => (editingSettings.value = true),
            },
        ],
    ]);
</script>

<template>
    <template v-if="canEdit">
        <UDropdownMenu :items="drivingMenuItems">
            <UButton
                color="neutral"
                icon="i-lucide-ellipsis-vertical"
                variant="subtle"
                :aria-label="t('common.moreOptions')"
            />
        </UDropdownMenu>

        <SettingsDialog v-model:visible="editingSettings" />
    </template>
</template>
