import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, terminate, writeBatch } from 'firebase/firestore';

import {
    ARCHIVED_SEASON,
    E2E_EMAIL,
    E2E_PASSWORD,
    emulatorClient,
} from './helpers/app';

const SEASON = '2026-2027';
const PLAYERS = ['Anna', 'Bram', 'Cees', 'Daan', 'Eva', 'Fenna'];

// Nothing can edit an inactive season, so this is fixed for the whole run.
const ARCHIVE_SQUAD = ['anna', 'bram', 'cees'];
const ARCHIVE_MATCHES = [
    {
        id: 'archive-win',
        opponent: 'Oude Rivaal',
        date: new Date(2026, 2, 14, 10),
        home: true,
        result: { goalsFor: 3, goalsAgainst: 1 },
        goals: { anna: 2, bram: 1 } as Record<string, number>,
    },
    {
        id: 'archive-loss',
        opponent: 'Verre Rivaal',
        date: new Date(2026, 3, 11, 10),
        home: false,
        result: { goalsFor: 0, goalsAgainst: 2 },
        goals: {} as Record<string, number>,
    },
];

const wipe = (url: string) => fetch(url, { method: 'DELETE' });

/**
 * Wipes both emulators, then seeds an editable season with a squad for the
 * write specs and a finished, inactive one for the read-only specs.
 */
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
    const member = { active: true, guestPlayer: false };

    batch.set(doc(db, 'settings', 'app'), {
        drivingEnabled: true,
        regulationsEnabled: true,
    });
    batch.set(doc(db, 'seasons', SEASON), {
        active: true,
        teamname: 'JO9-1',
        trainingDays: [2, 4],
        halfDurationMinutes: 20,
    });
    batch.set(doc(db, 'seasons', ARCHIVED_SEASON), {
        active: false,
        teamname: 'JO8-1',
        halfDurationMinutes: 20,
    });

    for (const name of PLAYERS) {
        const id = name.toLowerCase();
        batch.set(doc(db, 'players', id), {
            id,
            name,
            seasons: {
                [SEASON]: member,
                ...(ARCHIVE_SQUAD.includes(id) && {
                    [ARCHIVED_SEASON]: member,
                }),
            },
        });
    }

    for (const { id, goals, ...match } of ARCHIVE_MATCHES) {
        const path = `seasons/${ARCHIVED_SEASON}/matches/${id}`;
        batch.set(doc(db, path), { ...match, ended: true, paused: false });

        for (const playerId of ARCHIVE_SQUAD) {
            batch.set(doc(db, `${path}/appearances/${playerId}`), {
                playerId,
                present: true,
                isGoalkeeper: playerId === 'cees',
                goals: goals[playerId] ?? 0,
                seasonId: ARCHIVED_SEASON,
            });
        }
    }

    await batch.commit();
    await terminate(db);
};
