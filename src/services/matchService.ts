import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase';
import { usePlayerStore } from '@/stores/playerStore';
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
            ...(match.knvbCode && { knvbCode: match.knvbCode }),
            ...match.venue,
            ...(match.referee && { referee: match.referee }),
            ...(match.meetingTime && {
                driving: { meetingTime: match.meetingTime },
            }),
            createdAt: serverTimestamp(),
            ended: false,
            paused: false,
        },
    );

    const playerIds = match.playerIds || [];

    if (playerIds.length) {
        const playerStore = usePlayerStore();
        const batch = writeBatch(db);
        const appearancesCollection = collection(matchRef, 'appearances');
        for (const playerId of playerIds) {
            batch.set(doc(appearancesCollection), {
                playerId,
                present: true,
                isGoalkeeper: playerStore.isDefaultGoalkeeper(
                    playerId,
                    seasonId,
                ),
                goals: 0,
                seasonId,
            });
        }
        await batch.commit();
    }

    return matchRef;
};
