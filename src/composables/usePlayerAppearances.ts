import { computed, type ComputedRef } from 'vue';

import { useMatchStore } from '@/stores/matchStore';
import type { Appearance } from '@/types';

/**
 * A player's appearances for the currently loaded matches, restricted to
 * matches that have ended — matches still to be played (or in progress) must
 * not count towards a player's statistics.
 *
 * `playerId` is taken as a getter so the result stays reactive when the route
 * id changes without the component remounting.
 */
export const usePlayerAppearances = (
    playerId: () => string,
): {
    endedMatchIds: ComputedRef<Set<string>>;
    playerAppearances: ComputedRef<Appearance[]>;
} => {
    const matchStore = useMatchStore();

    const endedMatchIds = computed(
        () =>
            new Set(matchStore.matches.filter((m) => m.ended).map((m) => m.id)),
    );

    const playerAppearances = computed(() =>
        matchStore.appearances.filter(
            (a) =>
                a.playerId === playerId() && endedMatchIds.value.has(a.matchId),
        ),
    );

    return { endedMatchIds, playerAppearances };
};
