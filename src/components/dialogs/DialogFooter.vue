<script setup lang="ts">
    const { confirmColor = 'primary' } = defineProps<{
        confirmLabel: string;
        confirmColor?: 'primary' | 'error';
        confirmIcon?: string;
        disabled?: boolean;
        loading?: boolean;
    }>();

    const emit = defineEmits<{ cancel: []; confirm: [] }>();
</script>

<template>
    <div class="flex w-full justify-between">
        <UButton
            color="neutral"
            :label="$t('common.cancel')"
            variant="subtle"
            @click="emit('cancel')"
        />
        <UButton
            :color="confirmColor"
            :disabled="disabled"
            :icon="confirmIcon"
            :label="confirmLabel"
            :loading="loading"
            @click="emit('confirm')"
        />
    </div>
</template>
