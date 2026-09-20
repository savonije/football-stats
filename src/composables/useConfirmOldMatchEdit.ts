import { useI18n } from 'vue-i18n';

import { useConfirmDialog } from '@/composables/useConfirmDialog';
import type { Match } from '@/types';

const OLD_MATCH_DAYS = 14;

export const useConfirmOldMatchEdit = () => {
    const { t } = useI18n();
    const confirm = useConfirmDialog();

    return async (match: Match | null) => {
        if (!match) return false;

        const isOld =
            Date.now() - match.date.toMillis() >=
            OLD_MATCH_DAYS * 24 * 60 * 60 * 1000;

        return (
            !isOld ||
            confirm({
                title: t('match.editMatch'),
                message: t('match.editOldMatchConfirm'),
                confirmLabel: t('common.edit'),
            })
        );
    };
};
