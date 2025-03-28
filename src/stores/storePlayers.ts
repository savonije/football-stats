import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
} from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import type { Player } from '@/types';

const collectionRef = collection(db, 'players');

export const useStorePlayers = defineStore('storePlayers', {
    state: (): { players: Player[]; playersLoaded: boolean } => {
        return { players: [], playersLoaded: false };
    },
    actions: {
        getPlayers() {
            const q = query(collectionRef, orderBy('name', 'desc'));

            onSnapshot(q, (querySnapshot) => {
                this.playersLoaded = false;

                this.players = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    name: doc.data().name,
                }));

                this.playersLoaded = true;
            });
        },

        async addPlayer(player: Player) {
            try {
                await addDoc(collectionRef, {
                    ...player,
                });
            } catch (error) {
                console.error('Error adding game:', error);
            }
        },
    },
});
