import {
    collection,
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import type { Player, PlayerSeasonInfo } from '@/types';
import { isActiveInSeason } from '@/utils/playerSeason';

export const usePlayerStore = defineStore('playerStore', {
    state: (): {
        players: Player[];
        playersLoaded: boolean;
        selectedPlayer: Player | null;
    } => ({
        players: [],
        playersLoaded: false,
        selectedPlayer: null,
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
            const player = { id: snap.id, ...snap.data() } as Player;
            this.selectedPlayer = player;
            return player;
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
                [`seasons.${seasonId}`]: info,
            });
        },

        // TODO: REMOVE WHEN USED
        // One-off, idempotent migration: move the legacy top-level
        // `guestPlayer` flag into the per-season map under the launch season.
        // Reads fresh from Firestore so it works regardless of app state.
        // Trigger once while authenticated, then remove the trigger.
        async migratePlayerSeasons() {
            const launchSeason = '2025-2026';
            const snap = await getDocs(collection(db, 'players'));
            const batch = writeBatch(db);
            let count = 0;
            snap.docs.forEach((d) => {
                const data = d.data() as Player & { guestPlayer?: boolean };
                if (data.seasons?.[launchSeason]) return;
                batch.update(doc(db, 'players', d.id), {
                    [`seasons.${launchSeason}`]: {
                        active: true,
                        guestPlayer: data.guestPlayer ?? false,
                    },
                    guestPlayer: deleteField(),
                });
                count++;
            });
            if (count) await batch.commit();
            return count;
        },

        deletePlayer(playerId: string) {
            return deleteDoc(doc(db, 'players', playerId));
        },

        async fetchPlayerName(playerId: string): Promise<string> {
            const playerRef = doc(db, 'players', playerId);
            const snap = await getDocs(
                query(collection(db, 'players'), where('id', '==', playerId)),
            );
            if (snap.empty) return playerId;
            const firstDoc = snap.docs[0];
            if (!firstDoc) return playerId;
            const docData = firstDoc.data() as Player;
            return docData.name ?? playerId;
        },
    },

    getters: {
        getPlayerById: (state) => (playerId: string) =>
            state.players.find((p) => p.id === playerId),
        playersSorted: (state) =>
            [...state.players].sort((a, b) => a.name.localeCompare(b.name)),
        playersInSeason: (state) => (seasonId: string) =>
            [...state.players]
                .filter((player) => isActiveInSeason(player, seasonId))
                .sort((a, b) => a.name.localeCompare(b.name)),
    },
});
