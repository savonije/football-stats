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
import { DEFAULT_HALF_DURATION_MINUTES } from '@/constants';

const STORAGE_KEY = 'selectedSeason';

export interface Season {
    id: string;
    active: boolean;
    teamname?: string;
    trainingDays?: number[];
    halfDurationMinutes?: number;
}

export const useSeasonStore = defineStore('seasonStore', {
    state: (): {
        currentSeason: string;
        seasons: Season[];
        seasonsLoaded: boolean;
    } => ({
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
        currentHalfDuration(state): number {
            const season = state.seasons.find(
                (s) => s.id === state.currentSeason,
            );
            return (
                season?.halfDurationMinutes ?? DEFAULT_HALF_DURATION_MINUTES
            );
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
                    trainingDays: d.data().trainingDays ?? [],
                    halfDurationMinutes: d.data().halfDurationMinutes,
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

        async setHalfDuration(id: string, minutes: number) {
            await updateDoc(doc(db, 'seasons', id), {
                halfDurationMinutes: minutes,
            });
            await this.fetchSeasons();
        },

        async setTrainingDays(id: string, days: number[]) {
            await updateDoc(doc(db, 'seasons', id), {
                trainingDays: [...days].sort((a, b) => a - b),
            });
            await this.fetchSeasons();
        },
    },
});
