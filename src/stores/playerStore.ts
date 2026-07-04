import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    setDoc,
    updateDoc,
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

        deletePlayer(playerId: string) {
            return deleteDoc(doc(db, 'players', playerId));
        },

        async fetchPlayerName(playerId: string): Promise<string> {
            const snap = await getDoc(doc(db, 'players', playerId));
            if (!snap.exists()) return playerId;
            const docData = snap.data() as Player;
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
