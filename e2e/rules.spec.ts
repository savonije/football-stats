import { expect, test } from '@playwright/test';
import { deleteApp } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

import { E2E_EMAIL, E2E_PASSWORD, emulatorClient } from './helpers/app';

// Straight against the emulator, which enforces firestore.rules: the UI hides
// edit controls when signed out, so it can never show a write being refused.
test('firestore.rules: anyone reads, only signed-in users write', async () => {
    const guest = emulatorClient('rules-guest');
    const coach = emulatorClient('rules-coach');
    await signInWithEmailAndPassword(coach.auth, E2E_EMAIL, E2E_PASSWORD);

    const path = ['rules-check', `${Date.now()}`] as const;

    try {
        const season = await getDoc(doc(guest.db, 'seasons', '2026-2027'));
        expect(season.exists()).toBe(true);

        await expect(
            setDoc(doc(guest.db, ...path), { ok: 1 }),
        ).rejects.toMatchObject({ code: 'permission-denied' });

        await setDoc(doc(coach.db, ...path), { ok: 1 });
        await deleteDoc(doc(coach.db, ...path));
    } finally {
        await Promise.all([deleteApp(guest.app), deleteApp(coach.app)]);
    }
});
