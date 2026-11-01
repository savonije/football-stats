import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vite-plus/test';

import type { Match } from '@/types';
import {
    normalizeTeamName,
    reconcileKnvbMatches,
    type KnvbMatch,
} from '@/utils/knvb';

const KICKOFF = new Date(2026, 9, 17, 9, 30);
const VENUE = { location: 'Sportpark', field: 'Veld 2', dressingRoom: '3' };

const knvb = (overrides: Partial<KnvbMatch> = {}): KnvbMatch => ({
    code: 123,
    date: KICKOFF,
    opponent: 'Rivaal JO9-1',
    home: true,
    venue: VENUE,
    ...overrides,
});

const match = (overrides: Partial<Match> = {}) =>
    ({
        id: 'm1',
        opponent: 'Rivaal JO9-1',
        date: Timestamp.fromDate(KICKOFF),
        home: true,
        ended: false,
        paused: false,
        knvbCode: 123,
        ...VENUE,
        ...overrides,
    }) as Match;

describe('normalizeTeamName', () => {
    it('reads the season name the way the KNVB writes it', () => {
        expect(normalizeTeamName('JO10-1')).toBe('o101');
        expect(normalizeTeamName('O10-1')).toBe('o101');
        expect(normalizeTeamName("Apollo '69 JO9-2")).toBe('apollo69o92');
    });
});

describe('reconcileKnvbMatches', () => {
    it('adds matches it does not know', () => {
        expect(reconcileKnvbMatches([], [knvb()])).toEqual({
            toAdd: [knvb()],
            toUpdate: [],
        });
    });

    it('leaves an unchanged match alone', () => {
        expect(reconcileKnvbMatches([match()], [knvb()])).toEqual({
            toAdd: [],
            toUpdate: [],
        });
    });

    it('treats a shortened opponent name as the same opponent', () => {
        const result = reconcileKnvbMatches(
            [match({ opponent: 'Rivaal' })],
            [knvb()],
        );
        expect(result.toUpdate).toEqual([]);
    });

    it.each([
        ['opponent', { opponent: 'Ander' }],
        ['home/away', { home: false }],
        ['kickoff', { date: Timestamp.fromDate(new Date(2026, 9, 17)) }],
        ['venue', { field: 'Veld 1' }],
    ] as const)('updates a match whose %s changed', (_, overrides) => {
        const existing = match(overrides);
        expect(reconcileKnvbMatches([existing], [knvb()]).toUpdate).toEqual([
            { match: existing, knvb: knvb() },
        ]);
    });

    it('claims a hand-entered match on the same day', () => {
        const handEntered = match({
            knvbCode: undefined,
            date: Timestamp.fromDate(new Date(2026, 9, 17)),
        });

        const result = reconcileKnvbMatches([handEntered], [knvb()]);
        expect(result.toAdd).toEqual([]);
        expect(result.toUpdate[0]?.match).toBe(handEntered);
    });

    it('never claims a same-day match that carries another code', () => {
        const result = reconcileKnvbMatches(
            [match({ knvbCode: 999 })],
            [knvb()],
        );
        expect(result.toAdd).toEqual([knvb()]);
    });

    it('matches by code before matching by day', () => {
        const sameDay = match({ id: 'handmade', knvbCode: undefined });
        const byCode = match({
            id: 'synced',
            date: Timestamp.fromDate(new Date(2026, 9, 10, 9, 30)),
        });

        const result = reconcileKnvbMatches([sameDay, byCode], [knvb()]);
        expect(result.toUpdate.map((u) => u.match.id)).toEqual(['synced']);
    });
});
