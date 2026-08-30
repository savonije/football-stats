<script setup lang="ts">
    import { watch } from 'vue';

    withDefaults(
        defineProps<{
            title: string;
            message: string;
            confirmLabel?: string;
            confirmColor?: 'primary' | 'error';
            icon?: string;
        }>(),
        {
            confirmLabel: undefined,
            confirmColor: 'primary',
            icon: 'i-lucide-triangle-alert',
        },
    );

    // `useOverlay` binds this from OverlayProvider; UModal manages its own
    // state without it, which leaves the dialog on screen after a choice.
    const open = defineModel<boolean>('open', { default: false });

    const emit = defineEmits<{ close: [confirmed: boolean] }>();

    // Closing the modal is the single exit path, so dismissing with Esc or the
    // close button resolves the promise as a decline rather than hanging.
    let confirmed = false;

    const respond = (value: boolean) => {
        confirmed = value;
        open.value = false;
    };

    watch(open, (isOpen) => {
        if (!isOpen) emit('close', confirmed);
    });
</script>

<template>
    <UModal
        v-model:open="open"
        :content="{ role: 'alertdialog' }"
        :title="title"
        :ui="{ content: 'w-sm' }"
    >
        <template #body>
            <div class="flex items-start gap-3">
                <UIcon
                    class="mt-0.5 size-5 shrink-0"
                    :class="
                        confirmColor === 'error'
                            ? 'text-red-500'
                            : 'text-primary-500'
                    "
                    :name="icon"
                />
                <p class="m-0 text-sm">{{ message }}</p>
            </div>
        </template>

        <template #footer>
            <div class="flex w-full justify-between">
                <UButton
                    color="neutral"
                    :label="$t('common.cancel')"
                    variant="subtle"
                    @click="respond(false)"
                />
                <UButton
                    :color="confirmColor"
                    :label="confirmLabel ?? $t('common.confirm')"
                    @click="respond(true)"
                />
            </div>
        </template>
    </UModal>
</template>
