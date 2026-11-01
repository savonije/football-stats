import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vite-plus/test';

import type { Appearance, Match, MatchDriving, Player } from '@/types';
import { planDriving } from '@/utils/driving';

const SEASON = '2026-2027';
const NOW = new Date(2026, 9, 15, 12);

const match = (
    id: string,
    day: number,
    { home = false, driving }: { home?: boolean; driving?: MatchDriving } = {},
) =>
    ({
        id,
        opponent: id,
        date: Timestamp.fromDate(new Date(2026, 9, day, 10)),
        home,
        ended: false,
        paused: false,
        driving,
    }) as Match;

const player = (
    name: string,
    drives: { alwaysDrives?: boolean; neverDrives?: boolean } = {},
): Player => ({
    id: name,
    name,
    seasons: { [SEASON]: { active: true, guestPlayer: false, ...drives } },
});

const squad = (matchId: string, ids: string[], present = true) =>
    ids.map((playerId): Appearance => ({
        id: `${matchId}-${playerId}`,
        playerId,
        matchId,
        present,
        goals: 0,
        isGoalkeeper: false,
        seasonId: SEASON,
    }));

const players = [
    player('anna', { alwaysDrives: true }),
    player('bram', { neverDrives: true }),
    player('cees'),
    player('daan'),
    player('eva'),
];
const everyone = players.map((p) => p.id);

const plan = (matches: Match[], appearances: Appearance[], perCar = 3) =>
    planDriving(matches, appearances, players, SEASON, perCar, NOW);

describe('planDriving', () => {
    it('proposes vaste rijders first, then by name, skipping never-drivers', () => {
        const { plans } = plan([match('m1', 20)], squad('m1', everyone));

        expect(plans).toHaveLength(1);
        expect(plans[0]).toMatchObject({
            past: false,
            squadSize: 5,
            needed: 2,
            drivers: ['anna', 'cees'],
            saved: false,
            next: 'daan',
        });
    });

    it('only counts present players towards the squad', () => {
        const { plans } = plan(
            [match('m1', 20)],
            [...squad('m1', ['cees', 'daan']), ...squad('m1', ['eva'], false)],
            1,
        );

        expect(plans[0]).toMatchObject({ squadSize: 2, needed: 2 });
        expect(plans[0]?.drivers).toEqual(['cees', 'daan']);
    });

    it('rotates whoever has driven least across upcoming matches', () => {
        const ids = ['cees', 'daan', 'eva'];
        const { plans, counts } = plan(
            [match('m2', 27), match('m1', 20)],
            [...squad('m1', ids), ...squad('m2', ids)],
        );

        expect(plans.map((p) => p.match.id)).toEqual(['m1', 'm2']);
        expect(plans.map((p) => p.drivers)).toEqual([['cees'], ['daan']]);
        expect(counts.get('cees')).toEqual({ driven: 0, planned: 1 });
        expect(counts.get('eva')).toEqual({ driven: 0, planned: 0 });
    });

    it('counts saved drivers of later matches before proposing', () => {
        const ids = ['cees', 'daan'];
        const { plans } = plan(
            [
                match('m1', 20),
                match('m2', 27, { driving: { drivers: ['cees'] } }),
            ],
            [...squad('m1', ids), ...squad('m2', ids)],
        );

        expect(plans[0]?.drivers).toEqual(['daan']);
        expect(plans[1]).toMatchObject({ drivers: ['cees'], saved: true });
    });

    it('keeps saved drivers as they are and suggests the next one', () => {
        const { plans } = plan(
            [match('m1', 20, { driving: { drivers: ['eva'] } })],
            squad('m1', everyone),
        );

        expect(plans[0]).toMatchObject({
            drivers: ['eva'],
            saved: true,
            next: 'anna',
        });
    });

    it('leaves out parents who said they cannot drive', () => {
        const { plans } = plan(
            [match('m1', 20, { driving: { excluded: ['anna', 'cees'] } })],
            squad('m1', everyone),
        );

        expect(plans[0]?.drivers).toEqual(['daan', 'eva']);
    });

    it('skips home matches and unplanned past matches', () => {
        const { plans } = plan(
            [match('home', 20, { home: true }), match('past', 10)],
            [...squad('home', everyone), ...squad('past', everyone)],
        );

        expect(plans).toEqual([]);
    });

    it('keeps an upcoming match without a squad, with no drivers', () => {
        const { plans } = plan([match('empty', 27)], []);

        expect(plans[0]).toMatchObject({
            squadSize: 0,
            needed: 0,
            drivers: [],
            saved: false,
        });
    });

    it('reports a saved past match as driven', () => {
        const { plans, counts } = plan(
            [match('m1', 10, { driving: { drivers: ['cees'] } })],
            squad('m1', ['cees']),
        );

        expect(plans[0]).toMatchObject({ past: true, saved: true });
        expect(counts.get('cees')).toEqual({ driven: 1, planned: 0 });
    });
});
