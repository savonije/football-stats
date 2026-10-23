import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import { useStoreAuth } from '@/stores/authStore';

const regulationsRef = (seasonId: string) =>
    doc(db, `seasons/${seasonId}/general/regulations`);

let _unsubscribeRegulations: (() => void) | null = null;

export const useRegulationsStore = defineStore('regulationsStore', {
    state: (): {
        content: string;
        updatedAt: Date | null;
        updatedBy: string | null;
        regulationsLoaded: boolean;
    } => ({
        content: '',
        updatedAt: null,
        updatedBy: null,
        regulationsLoaded: false,
    }),

    actions: {
        fetchRegulations(seasonId: string) {
            _unsubscribeRegulations?.();
            this.regulationsLoaded = false;
            _unsubscribeRegulations = onSnapshot(
                regulationsRef(seasonId),
                (snap) => {
                    const data = snap.data({ serverTimestamps: 'estimate' });
                    this.content = data?.content ?? '';
                    this.updatedAt = data?.updatedAt?.toDate() ?? null;
                    this.updatedBy = data?.updatedBy?.email ?? null;
                    this.regulationsLoaded = true;
                },
                (err) => {
                    console.error(err);
                    this.regulationsLoaded = true;
                },
            );
        },

        async updateRegulations(seasonId: string, content: string) {
            const { user } = useStoreAuth();
            await setDoc(regulationsRef(seasonId), {
                content,
                updatedAt: serverTimestamp(),
                updatedBy: { id: user?.id ?? null, email: user?.email ?? null },
            });
        },
    },
});
