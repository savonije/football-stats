import {
    collection,
    doc,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase';

/**
 * Bulk-create a training per date, committed in a single batch. Presence is
 * tracked as a `presentPlayerIds` array on each training doc (empty at
 * creation) rather than a seeded record per player, so each date is a single
 * write — a full season of sessions stays far below Firestore's 500-op limit.
 */
export const addTrainings = async (seasonId: string, dates: Date[]) => {
    if (!dates.length) return 0;

    const batch = writeBatch(db);
    const trainingsCol = collection(db, 'seasons', seasonId, 'trainings');

    for (const date of dates) {
        batch.set(doc(trainingsCol), {
            date,
            createdAt: serverTimestamp(),
            cancelled: false,
            presentPlayerIds: [],
        });
    }

    await batch.commit();
    return dates.length;
};
