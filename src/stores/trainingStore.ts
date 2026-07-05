import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { defineStore } from 'pinia';

import { db } from '@/firebase';
import { usePlayerStore } from '@/stores/playerStore';
import type { Training, TrainingAttendance } from '@/types';

let _unsubscribeTrainings: (() => void) | null = null;
let _unsubscribeTrainingDetails: (() => void) | null = null;
let _unsubscribeAttendances: (() => void) | null = null;

export const useTrainingStore = defineStore('trainingStore', {
    state: (): {
        trainings: Training[];
        trainingsLoaded: boolean;
        selectedTraining: Training | null;
        attendances: TrainingAttendance[];
        attendancesLoaded: boolean;
    } => ({
        trainings: [],
        trainingsLoaded: false,
        selectedTraining: null,
        attendances: [],
        attendancesLoaded: false,
    }),

    actions: {
        /** -----------------------------
         *  TRAININGS
         * ----------------------------- */
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
            const trainingRef = doc(
                db,
                `seasons/${seasonId}/trainings/${trainingId}`,
            );
            _unsubscribeTrainingDetails = onSnapshot(trainingRef, (snap) => {
                this.selectedTraining = snap.exists()
                    ? ({ id: snap.id, ...snap.data() } as Training)
                    : null;
            });
            this.fetchAttendances(seasonId, trainingId);
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

        async deleteTraining(seasonId: string, trainingId: string) {
            const attendancesRef = collection(
                db,
                `seasons/${seasonId}/trainings/${trainingId}/attendances`,
            );
            const snapshot = await getDocs(attendancesRef);

            const deletePromises = snapshot.docs.map((doc) =>
                deleteDoc(doc.ref),
            );
            await Promise.all(deletePromises);

            await deleteDoc(
                doc(db, `seasons/${seasonId}/trainings/${trainingId}`),
            );
        },

        /** -----------------------------
         *  ATTENDANCES
         * ----------------------------- */
        fetchAttendances(seasonId: string, trainingId?: string) {
            _unsubscribeAttendances?.();
            this.attendancesLoaded = false;
            const q = trainingId
                ? collection(
                      db,
                      `seasons/${seasonId}/trainings/${trainingId}/attendances`,
                  )
                : query(
                      collectionGroup(db, 'attendances'),
                      where('seasonId', '==', seasonId),
                  );

            _unsubscribeAttendances = onSnapshot(q, (snapshot) => {
                this.attendances = snapshot.docs.map((doc) => {
                    const data = doc.data() as TrainingAttendance;
                    return {
                        id: doc.id,
                        playerId: data.playerId,
                        seasonId: data.seasonId,
                        trainingId:
                            trainingId ??
                            doc.ref.parent.parent?.id ??
                            data.trainingId,
                        present: data.present ?? false,
                    };
                });
                this.attendancesLoaded = true;
            });
        },

        setAttendancePresent(
            seasonId: string,
            trainingId: string,
            attendanceId: string,
            present: boolean,
        ) {
            return updateDoc(
                doc(
                    db,
                    `seasons/${seasonId}/trainings/${trainingId}/attendances/${attendanceId}`,
                ),
                { present },
            );
        },
    },

    getters: {
        presentCount: (state) =>
            state.attendances.filter((a) => a.present).length,

        attendeesWithNames: (state) => {
            const playerStore = usePlayerStore();
            return state.attendances
                .map((a) => ({
                    ...a,
                    playerName:
                        playerStore.getPlayerById(a.playerId)?.name ?? '',
                }))
                .sort((a, b) => a.playerName.localeCompare(b.playerName));
        },
    },
});
