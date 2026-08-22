import {
    addDoc,
    collection,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';

import { db } from '@/firebase';
import type { NewMatch } from '@/types';

export const addMatch = async (seasonId: string, match: NewMatch) => {
    const date =
        match.date instanceof Timestamp
            ? match.date.toDate()
            : new Date(match.date);
    const matchRef = await addDoc(
        collection(db, 'seasons', seasonId, 'matches'),
        {
            opponent: match.opponent,
            date,
            home: match.home,
            result: match.result || null,
            washing: match.washing || null,
            createdAt: serverTimestamp(),
            durationMinutes: 0,
            running: false,
            ended: false,
            paused: false,
        },
    );

    const playerIds = match.playerIds || [];

    if (playerIds.length) {
        const appearancesCollection = collection(matchRef, 'appearances');
        for (const playerId of playerIds) {
            await addDoc(appearancesCollection, {
                playerId,
                present: true,
                isGoalkeeper: false,
                goals: 0,
                seasonId,
            });
        }
    }

    return matchRef;
};
