import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
} from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import type { Training } from '@/types';

let _unsubscribeTrainings: (() => void) | null = null;
let _unsubscribeTrainingDetails: (() => void) | null = null;

export const useTrainingStore = defineStore('trainingStore', {
    state: (): {
        trainings: Training[];
        trainingsLoaded: boolean;
        selectedTraining: Training | null;
        selectedTrainingLoaded: boolean;
    } => ({
        trainings: [],
        trainingsLoaded: false,
        selectedTraining: null,
        selectedTrainingLoaded: false,
    }),

    actions: {
        fetchTrainings(seasonId: string) {
            _unsubscribeTrainings?.();
            this.trainingsLoaded = false;
            const trainingsRef = collection(
                db,
                `seasons/${seasonId}/trainings`,
            );
            _unsubscribeTrainings = onSnapshot(trainingsRef, (snapshot) => {
                this.trainings = snapshot.docs.map(
                    (doc) => ({ id: doc.id, ...doc.data() }) as Training,
                );
                this.trainingsLoaded = true;
            });
        },

        fetchTrainingDetails(seasonId: string, trainingId: string) {
            _unsubscribeTrainingDetails?.();
            this.selectedTrainingLoaded = false;
            const trainingRef = doc(
                db,
                `seasons/${seasonId}/trainings/${trainingId}`,
            );
            _unsubscribeTrainingDetails = onSnapshot(trainingRef, (snap) => {
                this.selectedTraining = snap.exists()
                    ? ({ id: snap.id, ...snap.data() } as Training)
                    : null;
                this.selectedTrainingLoaded = true;
            });
        },

        setTrainingCancelled(
            seasonId: string,
            trainingId: string,
            cancelled: boolean,
        ) {
            const trainingRef = doc(
                db,
                `seasons/${seasonId}/trainings/${trainingId}`,
            );
            return updateDoc(trainingRef, { cancelled });
        },

        deleteTraining(seasonId: string, trainingId: string) {
            return deleteDoc(
                doc(db, `seasons/${seasonId}/trainings/${trainingId}`),
            );
        },

        setPlayerPresent(
            seasonId: string,
            trainingId: string,
            playerId: string,
            present: boolean,
        ) {
            const trainingRef = doc(
                db,
                `seasons/${seasonId}/trainings/${trainingId}`,
            );
            return updateDoc(trainingRef, {
                presentPlayerIds: present
                    ? arrayUnion(playerId)
                    : arrayRemove(playerId),
            });
        },
    },
});
