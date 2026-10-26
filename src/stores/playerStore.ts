import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    setDoc,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import type { Player, PlayerSeasonInfo } from '@/types';
import { isActiveInSeason, playerSeasonInfo } from '@/utils/playerSeason';

export const usePlayerStore = defineStore('playerStore', {
    state: (): {
        players: Player[];
        playersLoaded: boolean;
    } => ({
        players: [],
        playersLoaded: false,
    }),

    actions: {
        fetchPlayers() {
            this.playersLoaded = false;
            const playersRef = collection(db, 'players');
            onSnapshot(playersRef, (snapshot) => {
                this.players = snapshot.docs.map(
                    (doc) => ({ id: doc.id, ...doc.data() }) as Player,
                );
                this.playersLoaded = true;
            });
        },

        async fetchPlayer(playerId: string): Promise<Player | null> {
            const snap = await getDoc(doc(db, 'players', playerId));
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() } as Player;
        },

        addPlayer(player: Player) {
            return setDoc(doc(db, 'players', player.id), player);
        },

        updatePlayer(playerId: string, data: Partial<Player>) {
            return updateDoc(doc(db, 'players', playerId), data);
        },

        setPlayerSeasonStatus(
            playerId: string,
            seasonId: string,
            info: PlayerSeasonInfo,
        ) {
            return updateDoc(doc(db, 'players', playerId), {
                [`seasons.${seasonId}.active`]: info.active,
                [`seasons.${seasonId}.guestPlayer`]: info.guestPlayer,
            });
        },

        /**
         * Matches planned so far first record the vaste rijders they were
         * planned with, so the change only applies to matches added later.
         */
        setAlwaysDrives(
            playerId: string,
            seasonId: string,
            alwaysDrives: boolean,
            plannedMatchIds: string[],
        ) {
            const current = this.players
                .filter(
                    (player) =>
                        playerSeasonInfo(player, seasonId)?.alwaysDrives,
                )
                .map((player) => player.id);

            const batch = writeBatch(db);
            for (const matchId of plannedMatchIds) {
                batch.update(
                    doc(db, `seasons/${seasonId}/matches/${matchId}`),
                    { 'driving.alwaysDrives': current },
                );
            }
            batch.update(doc(db, 'players', playerId), {
                [`seasons.${seasonId}.alwaysDrives`]: alwaysDrives,
            });

            return batch.commit();
        },

        deletePlayer(playerId: string) {
            return deleteDoc(doc(db, 'players', playerId));
        },
    },

    getters: {
        getPlayerById: (state) => (playerId: string) =>
            state.players.find((p) => p.id === playerId),
        playersInSeason: (state) => (seasonId: string) =>
            [...state.players]
                .filter((player) => isActiveInSeason(player, seasonId))
                .sort((a, b) => a.name.localeCompare(b.name)),
    },
});
