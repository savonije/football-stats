import { describe, expect, it } from 'vite-plus/test';

import {
    formatMatchTime,
    getDisplaySeconds,
    getFinalSeconds,
    getHalfProgress,
    getMatchMinute,
    getScoreSides,
    isInOvertime,
    isPlayed,
} from '@/utils/match';

const HALF = 20;
const START = 1_000_000;
const sec = (s: number) => START + s * 1000;

const running = (half = 1, pausedDuration = 0) => ({
    startTime: START,
    paused: false,
    pausedDuration,
    half,
});

describe('getDisplaySeconds', () => {
    it('is zero before kick-off', () => {
        expect(getDisplaySeconds(null, HALF, sec(10))).toBe(0);
        expect(getDisplaySeconds({ paused: false }, HALF, sec(10))).toBe(0);
    });

    it('subtracts earlier pauses while running', () => {
        expect(getDisplaySeconds(running(1, 5000), HALF, sec(65))).toBe(60);
    });

    it('stands still while paused', () => {
        const paused = {
            startTime: START,
            paused: true,
            pausedAt: sec(30),
            pausedDuration: 0,
            half: 1,
        };

        expect(getDisplaySeconds(paused, HALF, sec(30))).toBe(30);
        expect(getDisplaySeconds(paused, HALF, sec(500))).toBe(30);
    });

    it('offsets the second half by one half duration', () => {
        expect(getDisplaySeconds(running(2), HALF, sec(1))).toBe(1201);
    });
});

describe('isInOvertime', () => {
    it('starts only past the end of the current half', () => {
        expect(isInOvertime(running(1), HALF, sec(1200))).toBe(false);
        expect(isInOvertime(running(1), HALF, sec(1201))).toBe(true);
        expect(isInOvertime(running(2), HALF, sec(1200))).toBe(false);
        expect(isInOvertime(running(2), HALF, sec(1201))).toBe(true);
    });

    it('is false before kick-off', () => {
        expect(isInOvertime(undefined, HALF, sec(5000))).toBe(false);
    });
});

describe('formatMatchTime', () => {
    it.each([
        [0, '0:00'],
        [65.9, '1:05'],
        [1200, '20:00'],
        [-3, '0:00'],
    ])('formats %s as %s', (seconds, expected) => {
        expect(formatMatchTime(seconds)).toBe(expected);
    });
});

describe('getHalfProgress', () => {
    it('measures within the current half', () => {
        expect(getHalfProgress(running(2), HALF, sec(600))).toBe(0.5);
    });

    it('clamps overtime to a full ring', () => {
        expect(getHalfProgress(running(1), HALF, sec(1500))).toBe(1);
    });
});

describe('getFinalSeconds', () => {
    it('freezes on the moment the match was ended', () => {
        const ended = {
            startTime: START,
            paused: true,
            pausedAt: sec(1234),
            pausedDuration: 0,
            half: 2,
        };

        expect(getFinalSeconds(ended, HALF)).toBe(1200 + 1234);
    });

    it('falls back to the scheduled end of the last half', () => {
        expect(getFinalSeconds(null, HALF)).toBe(2400);
        expect(getFinalSeconds({ paused: false, half: 1 }, HALF)).toBe(1200);
    });
});

describe('getMatchMinute', () => {
    it('counts minute 1 from 0:00 to 0:59', () => {
        expect(getMatchMinute(running(1), HALF, sec(0))).toBe(1);
        expect(getMatchMinute(running(1), HALF, sec(59))).toBe(1);
        expect(getMatchMinute(running(1), HALF, sec(60))).toBe(2);
        expect(getMatchMinute(running(2), HALF, sec(0))).toBe(21);
    });

    it('has no minute when the clock never ran', () => {
        expect(getMatchMinute({ paused: false }, HALF, sec(60))).toBeNull();
    });
});

describe('isPlayed', () => {
    it('counts a match scored without ever starting the timer', () => {
        expect(isPlayed({ ended: true })).toBe(true);
        expect(isPlayed({ ended: false })).toBe(false);
        expect(isPlayed({ ended: false, startTime: START })).toBe(true);
    });
});

describe('getScoreSides', () => {
    const result = { goalsFor: 3, goalsAgainst: 1 };

    it('puts the home side first', () => {
        const home = getScoreSides(
            { home: true, opponent: 'Rivaal', result },
            'Apollo',
        );
        const away = getScoreSides(
            { home: false, opponent: 'Rivaal', result },
            'Apollo',
        );

        expect(home.map((s) => s.name)).toEqual(['Apollo', 'Rivaal']);
        expect(away.map((s) => [s.type, s.goals])).toEqual([
            ['against', 1],
            ['for', 3],
        ]);
    });

    it('reads a missing result as 0-0', () => {
        const sides = getScoreSides({ home: true, opponent: 'Rivaal' }, 'A');
        expect(sides.map((s) => s.goals)).toEqual([0, 0]);
    });
});
