import { doc, setDoc } from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import type { Game } from '@/types';

export const useStoreGames = defineStore('storeDVDs', {
    state: (): { Games: Game[]; GamesLoaded: boolean } => {
        return { Games: [], GamesLoaded: false };
    },
    actions: {
        addGame(game: Game) {
            setDoc(doc(db, 'games', game.id), game);
        },
    },
});
