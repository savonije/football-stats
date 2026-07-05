import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';

import { db } from '@/firebase';
import type { NewTraining, TrainingAttendance } from '@/types';

export const addTraining = async (seasonId: string, training: NewTraining) => {
    const date =
        training.date instanceof Timestamp
            ? training.date.toDate()
            : new Date(training.date);

    const trainingRef = await addDoc(
        collection(db, 'seasons', seasonId, 'trainings'),
        {
            date,
            createdAt: serverTimestamp(),
            cancelled: false,
        },
    );

    const playerIds = training.playerIds || [];

    if (playerIds.length) {
        const attendancesCollection = collection(trainingRef, 'attendances');
        for (const playerId of playerIds) {
            await addDoc(attendancesCollection, {
                playerId,
                present: true,
                seasonId,
            });
        }
    }

    return trainingRef;
};

export async function updateAttendance(
    seasonId: string,
    trainingId: string,
    attendanceId: string,
    data: Partial<TrainingAttendance>,
) {
    const ref = doc(
        db,
        `seasons/${seasonId}/trainings/${trainingId}/attendances/${attendanceId}`,
    );
    await updateDoc(ref, data);
}
