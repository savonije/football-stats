import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { defineStore } from 'pinia';

import { PLAYERS_PER_CAR } from '@/constants';
import { db } from '@/firebase';

const settingsRef = () => doc(db, 'settings', 'app');

let _unsubscribeSettings: (() => void) | null = null;

export const useSettingsStore = defineStore('settingsStore', {
    state: (): {
        sportlinkClientId: string;
        regulationsEnabled: boolean;
        washingEnabled: boolean;
        drivingEnabled: boolean;
        playersPerCar: number;
        settingsLoaded: boolean;
    } => ({
        sportlinkClientId: '',
        regulationsEnabled: false,
        washingEnabled: true,
        drivingEnabled: false,
        playersPerCar: PLAYERS_PER_CAR,
        settingsLoaded: false,
    }),

    actions: {
        fetchSettings() {
            _unsubscribeSettings?.();
            _unsubscribeSettings = onSnapshot(
                settingsRef(),
                (snap) => {
                    this.sportlinkClientId =
                        snap.data()?.sportlinkClientId ?? '';
                    this.regulationsEnabled =
                        snap.data()?.regulationsEnabled ?? false;
                    this.washingEnabled = snap.data()?.washingEnabled ?? true;
                    this.drivingEnabled = snap.data()?.drivingEnabled ?? false;
                    this.playersPerCar =
                        snap.data()?.playersPerCar ?? PLAYERS_PER_CAR;
                    this.settingsLoaded = true;
                },
                (err) => {
                    console.error(err);
                    this.settingsLoaded = true;
                },
            );
        },

        async updateSettings(settings: {
            sportlinkClientId: string;
            regulationsEnabled: boolean;
            washingEnabled: boolean;
            drivingEnabled: boolean;
        }) {
            await setDoc(
                settingsRef(),
                {
                    sportlinkClientId: settings.sportlinkClientId.trim(),
                    regulationsEnabled: settings.regulationsEnabled,
                    washingEnabled: settings.washingEnabled,
                    drivingEnabled: settings.drivingEnabled,
                },
                { merge: true },
            );
        },

        async setPlayersPerCar(playersPerCar: number) {
            await setDoc(settingsRef(), { playersPerCar }, { merge: true });
        },
    },
});
