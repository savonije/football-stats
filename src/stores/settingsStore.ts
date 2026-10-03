import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';

const settingsRef = () => doc(db, 'settings', 'app');

let _unsubscribeSettings: (() => void) | null = null;

export const useSettingsStore = defineStore('settingsStore', {
    state: (): { sportlinkClientId: string; settingsLoaded: boolean } => ({
        sportlinkClientId: '',
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
                    this.settingsLoaded = true;
                },
                (err) => {
                    console.error(err);
                    this.settingsLoaded = true;
                },
            );
        },

        async updateSettings(settings: { sportlinkClientId: string }) {
            await setDoc(
                settingsRef(),
                { sportlinkClientId: settings.sportlinkClientId.trim() },
                { merge: true },
            );
        },
    },
});
