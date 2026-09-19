<script setup lang="ts">
    import { watch } from 'vue';

    import DialogFooter from '@/components/dialogs/DialogFooter.vue';

    const { confirmColor = 'primary', icon = 'i-lucide-triangle-alert' } =
        defineProps<{
            title: string;
            message: string;
            confirmLabel?: string;
            confirmColor?: 'primary' | 'error';
            icon?: string;
        }>();

    const open = defineModel<boolean>('open', { default: false });

    const emit = defineEmits<{ close: [confirmed: boolean] }>();

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
            <DialogFooter
                :confirm-color="confirmColor"
                :confirm-label="confirmLabel ?? $t('common.confirm')"
                @cancel="respond(false)"
                @confirm="respond(true)"
            />
        </template>
    </UModal>
</template>
