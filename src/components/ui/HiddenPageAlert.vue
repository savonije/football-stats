<script setup lang="ts">
    import { useIsAdmin } from '@/composables/useIsAdmin';

    const { hidden } = defineProps<{ hidden: boolean }>();

    const isAdmin = useIsAdmin();
</script>

<template>
    <UAlert
        v-if="isAdmin && hidden"
        class="mb-4"
        color="warning"
        icon="i-lucide-eye-off"
        :title="$t('settings.hiddenForVisitors')"
        variant="subtle"
    />
</template>
