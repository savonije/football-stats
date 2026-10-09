<script setup lang="ts">
    import { useIsAdmin } from '@/composables/useIsAdmin';

    const { hidden, title = 'settings.hiddenForVisitors' } = defineProps<{
        hidden: boolean;
        title?: string;
    }>();

    const isAdmin = useIsAdmin();
</script>

<template>
    <UAlert
        v-if="isAdmin && hidden"
        class="mb-4"
        color="warning"
        icon="i-lucide-eye-off"
        :title="$t(title)"
        variant="subtle"
    />
</template>
