import { initializeApp } from 'firebase/app';
import {
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    getAuth,
} from 'firebase/auth';
import {
    connectFirestoreEmulator,
    doc,
    getFirestore,
    terminate,
    writeBatch,
} from 'firebase/firestore';

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/app';

const PROJECT_ID = 'demo-football-stats';
const FIRESTORE = 'http://127.0.0.1:8180';
const AUTH = 'http://127.0.0.1:9099';
const SEASON = '2026-2027';

const PLAYERS = ['Anna', 'Bram', 'Cees', 'Daan', 'Eva', 'Fenna'];

/** Wipes both emulators and seeds one editable season with a squad. */
export default async () => {
    await Promise.all([
        fetch(
            `${FIRESTORE}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
            { method: 'DELETE' },
        ),
        fetch(`${AUTH}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
            method: 'DELETE',
        }),
    ]);

    const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo' });
    const db = getFirestore(app);
    const auth = getAuth(app);
    connectFirestoreEmulator(db, '127.0.0.1', 8180);
    connectAuthEmulator(auth, AUTH, { disableWarnings: true });

    await createUserWithEmailAndPassword(auth, E2E_EMAIL, E2E_PASSWORD);

    const batch = writeBatch(db);
    batch.set(doc(db, 'seasons', SEASON), {
        active: true,
        teamname: 'JO9-1',
        trainingDays: [2, 4],
        halfDurationMinutes: 20,
    });
    for (const name of PLAYERS) {
        const id = name.toLowerCase();
        batch.set(doc(db, 'players', id), {
            id,
            name,
            seasons: { [SEASON]: { active: true, guestPlayer: false } },
        });
    }
    await batch.commit();
    await terminate(db);
};
