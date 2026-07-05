import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    Timestamp,
    updateDoc,
    writeBatch,
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

/**
 * Bulk-create a training per date (each seeded with a present attendance for
 * every player id), committed in a single batch. Firestore caps a batch at
 * 500 writes; a month of sessions for a youth squad stays well under that.
 */
export const addTrainings = async (
    seasonId: string,
    dates: Date[],
    playerIds: string[],
) => {
    if (!dates.length) return 0;

    const batch = writeBatch(db);
    const trainingsCol = collection(db, 'seasons', seasonId, 'trainings');

    for (const date of dates) {
        const trainingRef = doc(trainingsCol);
        batch.set(trainingRef, {
            date,
            createdAt: serverTimestamp(),
            cancelled: false,
        });

        const attendancesCol = collection(trainingRef, 'attendances');
        for (const playerId of playerIds) {
            batch.set(doc(attendancesCol), {
                playerId,
                present: true,
                seasonId,
            });
        }
    }

    await batch.commit();
    return dates.length;
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
