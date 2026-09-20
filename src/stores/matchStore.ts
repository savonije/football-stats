import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDocs,
    increment,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import { usePlayerStore } from '@/stores/playerStore';
import type { Appearance, Match, MatchGoal } from '@/types';

const resultField = (side: MatchGoal['side']) =>
    side === 'for' ? ('goalsFor' as const) : ('goalsAgainst' as const);

let _unsubscribeMatches: (() => void) | null = null;
let _unsubscribeMatchDetails: (() => void) | null = null;
let _unsubscribeAppearances: (() => void) | null = null;

export const useMatchStore = defineStore('matchStore', {
    state: (): {
        matches: Match[];
        matchesLoaded: boolean;
        selectedMatch: Match | null;
        appearances: Appearance[];
        appearancesLoaded: boolean;
    } => ({
        matches: [],
        matchesLoaded: false,
        selectedMatch: null,
        appearances: [],
        appearancesLoaded: false,
    }),

    actions: {
        /** -----------------------------
         *  MATCHES
         * ----------------------------- */
        fetchMatches(seasonId: string) {
            _unsubscribeMatches?.();
            this.matchesLoaded = false;
            const matchesRef = collection(db, `seasons/${seasonId}/matches`);
            _unsubscribeMatches = onSnapshot(matchesRef, (snapshot) => {
                this.matches = snapshot.docs.map(
                    (doc) => ({ id: doc.id, ...doc.data() }) as Match,
                );
                this.matchesLoaded = true;
            });
        },

        fetchMatchDetails(seasonId: string, matchId: string) {
            _unsubscribeMatchDetails?.();
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);
            _unsubscribeMatchDetails = onSnapshot(matchRef, (snap) => {
                const match = snap.exists()
                    ? ({ id: snap.id, ...snap.data() } as Match)
                    : null;
                this.selectedMatch = match;
            });
            this.fetchAppearances(seasonId, matchId);
        },

        updateMatch(
            seasonId: string,
            matchId: string,
            data: {
                opponent: string;
                date: Date;
                home: boolean;
                goalsFor: number;
                goalsAgainst: number;
            },
        ) {
            const { goalsFor, goalsAgainst, ...match } = data;
            const limit = { for: goalsFor, against: goalsAgainst };
            const seen = { for: 0, against: 0 };
            const goals: MatchGoal[] = [];
            const tallies = [];

            for (const goal of this.selectedMatch?.goals ?? []) {
                seen[goal.side] += 1;

                if (seen[goal.side] <= limit[goal.side]) goals.push(goal);
                else if (goal.playerId)
                    tallies.push(
                        this.updatePlayerGoals(
                            seasonId,
                            matchId,
                            goal.playerId,
                            -1,
                        ),
                    );
            }

            return Promise.all([
                updateDoc(doc(db, `seasons/${seasonId}/matches/${matchId}`), {
                    ...match,
                    result: { goalsFor, goalsAgainst },
                    goals,
                }),
                ...tallies,
            ]);
        },

        async deleteMatch(seasonId: string, matchId: string) {
            const appearancesRef = collection(
                db,
                `seasons/${seasonId}/matches/${matchId}/appearances`,
            );
            const snapshot = await getDocs(appearancesRef);

            const deletePromises = snapshot.docs.map((doc) =>
                deleteDoc(doc.ref),
            );
            await Promise.all(deletePromises);

            await deleteDoc(doc(db, `seasons/${seasonId}/matches/${matchId}`));
        },

        /** -----------------------------
         *  MATCH TIMER CONTROL
         * ----------------------------- */

        startMatch(seasonId: string, matchId: string) {
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);
            const now = Date.now();

            return updateDoc(matchRef, {
                ended: false,
                paused: false,
                startTime: now,
                pausedDuration: 0,
                pausedAt: null,
                half: 1,
                halfTime: false,
            });
        },

        endFirstHalf(seasonId: string, matchId: string) {
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);
            const now = Date.now();

            return updateDoc(matchRef, {
                paused: true,
                pausedAt: now,
                halfTime: true,
            });
        },

        startSecondHalf(seasonId: string, matchId: string) {
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);
            const now = Date.now();

            return updateDoc(matchRef, {
                half: 2,
                paused: false,
                halfTime: false,
                startTime: now,
                pausedDuration: 0,
                pausedAt: null,
            });
        },

        pauseMatch(seasonId: string, matchId: string) {
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);
            const now = Date.now();

            return updateDoc(matchRef, {
                paused: true,
                pausedAt: now,
            });
        },

        resumeMatch(seasonId: string, matchId: string) {
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);
            const now = Date.now();
            const match = this.selectedMatch;
            const pausedDuration = match?.pausedDuration ?? 0;
            const pausedAt = match?.pausedAt ?? now;

            return updateDoc(matchRef, {
                paused: false,
                pausedDuration: pausedDuration + (now - pausedAt),
                pausedAt: null,
            });
        },

        setMatchWashing(
            seasonId: string,
            matchId: string,
            washing: string | null,
        ) {
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);
            return updateDoc(matchRef, { washing: washing || null });
        },

        endMatch(seasonId: string, matchId: string) {
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);

            // Pausing on the final whistle freezes the clock, so the match
            // detail can show what it finished on instead of counting forever.
            return updateDoc(matchRef, {
                ended: true,
                paused: true,
                pausedAt: Date.now(),
                halfTime: false,
            });
        },

        /** -----------------------------
         *  APPEARANCES
         * ----------------------------- */
        fetchAppearances(seasonId: string, matchId?: string) {
            _unsubscribeAppearances?.();
            this.appearancesLoaded = false;
            const q = matchId
                ? collection(
                      db,
                      `seasons/${seasonId}/matches/${matchId}/appearances`,
                  )
                : query(
                      collectionGroup(db, 'appearances'),
                      where('seasonId', '==', seasonId),
                  );

            _unsubscribeAppearances = onSnapshot(q, (snapshot) => {
                this.appearances = snapshot.docs.map((doc) => {
                    const data = doc.data() as Appearance;
                    return {
                        id: doc.id,
                        playerId: data.playerId,
                        seasonId: data.seasonId,
                        matchId:
                            matchId ??
                            doc.ref.parent.parent?.id ??
                            data.matchId,
                        present: data.present ?? false,
                        goals: data.goals ?? 0,
                        isGoalkeeper: data.isGoalkeeper ?? false,
                    };
                });
                this.appearancesLoaded = true;
            });
        },

        addAppearance(
            seasonId: string,
            matchId: string,
            appearance: Appearance,
        ) {
            return setDoc(
                doc(
                    db,
                    `seasons/${seasonId}/matches/${matchId}/appearances`,
                    appearance.id,
                ),
                appearance,
            );
        },

        updateAppearance(
            seasonId: string,
            matchId: string,
            appearanceId: string,
            data: Partial<Appearance>,
        ) {
            return updateDoc(
                doc(
                    db,
                    `seasons/${seasonId}/matches/${matchId}/appearances/${appearanceId}`,
                ),
                data,
            );
        },

        deleteAppearance(
            seasonId: string,
            matchId: string,
            appearanceId: string,
        ) {
            return deleteDoc(
                doc(
                    db,
                    `seasons/${seasonId}/matches/${matchId}/appearances/${appearanceId}`,
                ),
            );
        },

        /** -----------------------------
         *  GOALS
         * ----------------------------- */

        /** Put a goal on the board. The timeline entry follows in `logGoal`. */
        scoreGoal(seasonId: string, matchId: string, side: MatchGoal['side']) {
            const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`);

            return updateDoc(matchRef, {
                [`result.${resultField(side)}`]: increment(1),
            });
        },

        /**
         * Record a goal on the timeline and credit its scorer. Our own goals
         * are only logged once a scorer has been picked, so this runs a beat
         * after `scoreGoal` for those, and right behind it for the opponent's.
         */
        // ponytail: the goal log is rewritten from the locally synced copy of
        // the match, so two people scoring in the same second can drop one.
        // Move it to a subcollection if the scoreboard ever has two operators.
        logGoal(seasonId: string, matchId: string, goal: MatchGoal) {
            return Promise.all([
                updateDoc(doc(db, `seasons/${seasonId}/matches/${matchId}`), {
                    goals: [...(this.selectedMatch?.goals ?? []), goal],
                }),
                goal.playerId
                    ? this.updatePlayerGoals(
                          seasonId,
                          matchId,
                          goal.playerId,
                          1,
                      )
                    : null,
            ]);
        },

        /**
         * Turn the opponent's last goal into an own goal by one of ours. The
         * score already counted against us, so only the timeline changes.
         */
        markOwnGoal(seasonId: string, matchId: string) {
            const goals = [...(this.selectedMatch?.goals ?? [])];
            const index = goals.map((goal) => goal.side).lastIndexOf('against');

            if (index === -1) return;

            goals[index] = { ...goals[index]!, ownGoal: true };

            return updateDoc(
                doc(db, `seasons/${seasonId}/matches/${matchId}`),
                { goals },
            );
        },

        /**
         * Undo the last goal for one side: the score, the timeline entry and
         * the scorer's tally all step back together.
         */
        removeLastGoal(
            seasonId: string,
            matchId: string,
            side: MatchGoal['side'],
        ) {
            const field = resultField(side);

            if ((this.selectedMatch?.result?.[field] ?? 0) <= 0) return;

            const goals = [...(this.selectedMatch?.goals ?? [])];
            const index = goals.map((goal) => goal.side).lastIndexOf(side);
            const removed = index === -1 ? null : goals.splice(index, 1)[0];

            return Promise.all([
                updateDoc(doc(db, `seasons/${seasonId}/matches/${matchId}`), {
                    [`result.${field}`]: increment(-1),
                    goals,
                }),
                removed?.playerId
                    ? this.updatePlayerGoals(
                          seasonId,
                          matchId,
                          removed.playerId,
                          -1,
                      )
                    : null,
            ]);
        },

        updatePlayerGoals(
            seasonId: string,
            matchId: string,
            playerId: string,
            delta: 1 | -1,
        ) {
            const appearance = this.appearances.find(
                (a) => a.playerId === playerId,
            );

            if (!appearance) return;
            if (delta < 0 && appearance.goals <= 0) return;

            return updateDoc(
                doc(
                    db,
                    `seasons/${seasonId}/matches/${matchId}/appearances/${appearance.id}`,
                ),
                { goals: increment(delta) },
            );
        },
    },

    getters: {
        presentPlayersWithNames: (state) => {
            const playerStore = usePlayerStore();
            return state.appearances
                .filter((a) => a.present)
                .map((a) => ({
                    ...a,
                    playerName:
                        playerStore.getPlayerById(a.playerId)?.name ?? '',
                }));
        },
    },
});
