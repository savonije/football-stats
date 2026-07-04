import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';

const STORAGE_KEY = 'selectedSeason';

export interface Season {
    id: string;
    active: boolean;
    teamname?: string;
}

export const useSeasonStore = defineStore('seasonStore', {
    state: (): {
        currentSeason: string;
        seasons: Season[];
        seasonsLoaded: boolean;
    } => ({
        // Empty until the season list loads; fetchSeasons() reconciles this
        // against Firestore (active season, or newest) on startup.
        currentSeason: localStorage.getItem(STORAGE_KEY) ?? '',
        seasons: [],
        seasonsLoaded: false,
    }),

    getters: {
        activeSeasonId(state): string | undefined {
            return state.seasons.find((season) => season.active)?.id;
        },
        currentTeamName(state): string {
            const season = state.seasons.find(
                (s) => s.id === state.currentSeason,
            );
            return season?.teamname ?? '';
        },
        isCurrentSeasonActive(state): boolean {
            return state.seasons.some(
                (season) => season.active && season.id === state.currentSeason,
            );
        },
    },

    actions: {
        async fetchSeasons() {
            const hadStoredSelection =
                localStorage.getItem(STORAGE_KEY) !== null;
            const snapshot = await getDocs(collection(db, 'seasons'));

            this.seasons = snapshot.docs
                .map((d) => ({
                    id: d.id,
                    active: d.data().active === true,
                    teamname: d.data().teamname,
                }))
                .sort((a, b) => b.id.localeCompare(a.id));
            this.seasonsLoaded = true;

            if (!this.seasons.length) return;

            const currentExists = this.seasons.some(
                (season) => season.id === this.currentSeason,
            );

            if (!currentExists) {
                this.setSeason(this.activeSeasonId ?? this.seasons[0]!.id);
            } else if (!hadStoredSelection && this.activeSeasonId) {
                // First visit with no stored choice: default to the active season.
                this.setSeason(this.activeSeasonId);
            }
        },

        setSeason(seasonId: string) {
            this.currentSeason = seasonId;
            localStorage.setItem(STORAGE_KEY, seasonId);
        },

        async addSeason(id: string) {
            await setDoc(doc(db, 'seasons', id), { active: false });
            await this.fetchSeasons();
        },

        async setActiveSeason(id: string) {
            // Enforce the single-active invariant: activate the chosen season
            // and deactivate every other one in a single atomic batch.
            const batch = writeBatch(db);
            this.seasons.forEach((season) => {
                batch.set(
                    doc(db, 'seasons', season.id),
                    { active: season.id === id },
                    { merge: true },
                );
            });
            await batch.commit();
            await this.fetchSeasons();
        },

        async setTeamName(id: string, teamname: string) {
            await updateDoc(doc(db, 'seasons', id), {
                teamname: teamname.trim(),
            });
            await this.fetchSeasons();
        },
    },
});
