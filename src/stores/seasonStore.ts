import { collection, getDocs } from 'firebase/firestore';
import { defineStore } from 'pinia';

import { SEASON } from '@/constants';
import { db } from '@/firebase';

const STORAGE_KEY = 'selectedSeason';

export const useSeasonStore = defineStore('seasonStore', {
    state: (): {
        currentSeason: string;
        seasons: string[];
        seasonsLoaded: boolean;
    } => ({
        currentSeason: localStorage.getItem(STORAGE_KEY) ?? SEASON,
        seasons: [],
        seasonsLoaded: false,
    }),

    actions: {
        async fetchSeasons() {
            const snapshot = await getDocs(collection(db, 'seasons'));
            this.seasons = snapshot.docs
                .map((doc) => doc.id)
                .sort()
                .reverse();
            this.seasonsLoaded = true;
            if (
                this.seasons.length &&
                !this.seasons.includes(this.currentSeason)
            ) {
                this.setSeason(this.seasons[0]!);
            }
        },

        setSeason(seasonId: string) {
            this.currentSeason = seasonId;
            localStorage.setItem(STORAGE_KEY, seasonId);
        },
    },
});
