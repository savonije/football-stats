import { computed, type ComputedRef } from 'vue';

import { useIsAdmin } from '@/composables/useIsAdmin';
import { useSeasonStore } from '@/stores/seasonStore';

/**
 * Whether the current user may edit data for the currently selected season.
 * Requires an admin and an active current season.
 */
export const useCanEdit = (): ComputedRef<boolean> => {
    const seasonStore = useSeasonStore();
    const isAdmin = useIsAdmin();

    return computed(() => isAdmin.value && seasonStore.isCurrentSeasonActive);
};
