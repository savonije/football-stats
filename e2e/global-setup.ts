import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, terminate, writeBatch } from 'firebase/firestore';

import { E2E_EMAIL, E2E_PASSWORD, emulatorClient } from './helpers/app';

const SEASON = '2026-2027';
const PLAYERS = ['Anna', 'Bram', 'Cees', 'Daan', 'Eva', 'Fenna'];

const wipe = (url: string) => fetch(url, { method: 'DELETE' });

/** Wipes both emulators and seeds one editable season with a squad. */
export default async () => {
    await Promise.all([
        wipe(
            'http://127.0.0.1:8180/emulator/v1/projects/demo-football-stats/databases/(default)/documents',
        ),
        wipe(
            'http://127.0.0.1:9099/emulator/v1/projects/demo-football-stats/accounts',
        ),
    ]);

    const { db, auth } = emulatorClient('global-setup');

    // Signs the client in too, which firestore.rules requires for the seed.
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
