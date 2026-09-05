import { computed, type ComputedRef } from 'vue';

import { useStoreAuth } from '@/stores/authStore';

/**
 * Whether the current user is a signed-in admin, regardless of which season
 * is selected. Use `useCanEdit()` for gating edit controls.
 */
export const useIsAdmin = (): ComputedRef<boolean> => {
    const authStore = useStoreAuth();

    return computed(() => !!authStore.user?.id);
};
