import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { db } from '@/firebase';

/**
 * Bulk-create a training per date, committed in a single batch. Each training
 * is seeded with an attendance record per player that starts as NOT present —
 * attendance is filled in manually per training afterwards. Firestore caps a
 * batch at 500 writes; a month of sessions for a youth squad stays well under.
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
                present: false,
                seasonId,
            });
        }
    }

    await batch.commit();
    return dates.length;
};
