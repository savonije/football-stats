import { useOverlay } from '@nuxt/ui/composables/useOverlay';

import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';

type ConfirmOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    confirmColor?: 'primary' | 'error';
    icon?: string;
};

/**
 * Replaces PrimeVue's `confirm.require({ accept })` callback with a promise,
 * so call sites read `if (await confirm({ ... }))` instead of branching in a
 * handler.
 */
export const useConfirmDialog = () => {
    const overlay = useOverlay();

    return (options: ConfirmOptions): Promise<boolean> => {
        const modal = overlay.create(ConfirmDialog, {
            destroyOnClose: true,
            props: options,
        });

        return modal.open().result.then((confirmed) => confirmed === true);
    };
};
