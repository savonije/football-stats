import { computed, type ComputedRef } from 'vue';

import { useStoreAuth } from '@/stores/authStore';
import { useSeasonStore } from '@/stores/seasonStore';

/**
 * Whether the current user may edit data for the currently selected season.
 * Requires an authenticated user and an active current season.
 */
export const useCanEdit = (): ComputedRef<boolean> => {
    const seasonStore = useSeasonStore();
    const authStore = useStoreAuth();

    return computed(
        () => !!authStore.user?.id && seasonStore.isCurrentSeasonActive,
    );
};
