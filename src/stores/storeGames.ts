import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import type { Game } from '@/types';

const collectionRef = collection(db, 'games');

export const useStoreGames = defineStore('storeGames', {
    state: (): { Games: Game[]; GamesLoaded: boolean } => {
        return { Games: [], GamesLoaded: false };
    },
    actions: {
        getGames() {
            const q = query(collectionRef, orderBy('date', 'desc'));

            onSnapshot(q, (querySnapshot) => {
                this.GamesLoaded = false;

                this.Games = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    opponent: doc.data().opponent,
                    goals_for: doc.data().goals_for,
                    goals_against: doc.data().goals_against,
                    season: doc.data().season,
                    date: new Date(doc.data().date),
                }));

                this.GamesLoaded = true;
            });
        },

        async addGame(game: Game) {
            try {
                const gameRef = await addDoc(collectionRef, {
                    ...game,
                    date: game.date.toISOString(),
                });

                console.log('New game added with ID:', gameRef.id);
            } catch (error) {
                console.error('Error adding game:', error);
            }
        },

        async updateGame(id: string, updates: Partial<Game>) {
            try {
                const gameRef = doc(db, 'games', id);
                await updateDoc(gameRef, updates);
            } catch (error) {
                console.error('Error updating game:', error);
            }
        },
    },
});
