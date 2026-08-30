import { useToast } from '@nuxt/ui/composables/useToast';
import { useI18n } from 'vue-i18n';

import { TOAST_LIFE } from '@/constants';

/**
 * Thin wrapper over Nuxt UI's toast so call sites only pass the message.
 * The heading and lifetime are the same everywhere, and were repeated at
 * every `toast.add()` under PrimeVue.
 */
export const useAppToast = () => {
    const toast = useToast();
    const { t } = useI18n();

    const add =
        (color: 'success' | 'warning' | 'error', defaultTitleKey: string) =>
        (description: string, title?: string) => {
            toast.add({
                title: title ?? t(defaultTitleKey),
                description,
                color,
                duration: TOAST_LIFE,
            });
        };

    return {
        success: add('success', 'common.messages.success'),
        warn: add('warning', 'common.validation.warning'),
        error: add('error', 'common.messages.error'),
    };
};
