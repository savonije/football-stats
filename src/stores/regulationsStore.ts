import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';

const regulationsRef = () => doc(db, 'general', 'regulations');

let _unsubscribeRegulations: (() => void) | null = null;

export const useRegulationsStore = defineStore('regulationsStore', {
    state: (): { content: string; regulationsLoaded: boolean } => ({
        content: '',
        regulationsLoaded: false,
    }),

    actions: {
        fetchRegulations() {
            _unsubscribeRegulations?.();
            _unsubscribeRegulations = onSnapshot(
                regulationsRef(),
                (snap) => {
                    this.content = snap.data()?.content ?? '';
                    this.regulationsLoaded = true;
                },
                (err) => {
                    console.error(err);
                    this.regulationsLoaded = true;
                },
            );
        },

        async updateRegulations(content: string) {
            await setDoc(regulationsRef(), { content });
        },
    },
});
