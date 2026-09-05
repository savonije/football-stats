import type { Match } from '@/types';

/**
 * A match has been started once its timer has run at least once.
 * `startTime` is set by `startMatch` and never cleared, so it stays
 * truthy while the match is running, paused, or ended.
 */
export const hasStarted = (
    match: Pick<Match, 'startTime'> | null | undefined,
): boolean => !!match?.startTime;

/**
 * A match has a score to show once it has been played. Matches scored without
 * ever starting the timer never get a `startTime`, so `ended` counts too.
 */
export const isPlayed = (
    match: Pick<Match, 'startTime' | 'ended'> | null | undefined,
): boolean => hasStarted(match) || !!match?.ended;

type TimedMatch = Pick<
    Match,
    'startTime' | 'paused' | 'pausedAt' | 'pausedDuration' | 'half'
>;

/**
 * Running elapsed time (ms) within the current half, excluding paused time.
 * `startTime`/`pausedDuration` are reset when a half starts, so this always
 * measures from the start of the current half.
 */
const getElapsedMs = (
    match: TimedMatch | null | undefined,
    now: number,
): number => {
    if (!match?.startTime) return 0;

    let elapsed = now - match.startTime;
    if (match.paused && match.pausedAt) {
        elapsed -= (match.pausedDuration ?? 0) + (now - match.pausedAt);
    } else {
        elapsed -= match.pausedDuration ?? 0;
    }
    return elapsed;
};

/**
 * The time to display on the match clock, in seconds. The second half is
 * offset by the half duration so it reads e.g. 20:00 at kickoff and keeps
 * counting up (overtime) past twice the half duration.
 */
export const getDisplaySeconds = (
    match: TimedMatch | null | undefined,
    halfDurationMinutes: number,
    now: number,
): number => {
    if (!match?.startTime) return 0;

    const half = match.half ?? 1;
    const offsetSeconds = (half - 1) * halfDurationMinutes * 60;
    return offsetSeconds + getElapsedMs(match, now) / 1000;
};

/**
 * Whether the clock has passed the scheduled end of the current half
 * (e.g. past 20:00 in the first half, past 40:00 in the second).
 */
export const isInOvertime = (
    match: TimedMatch | null | undefined,
    halfDurationMinutes: number,
    now: number,
): boolean => {
    if (!match?.startTime) return false;

    const half = match.half ?? 1;
    return (
        getDisplaySeconds(match, halfDurationMinutes, now) >
        half * halfDurationMinutes * 60
    );
};

/** Format a number of seconds as `M:SS`. */
export const formatMatchTime = (totalSeconds: number): string => {
    const clamped = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(clamped / 60);
    const seconds = clamped % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * How far the current half has run, as a fraction between 0 and 1. Overtime
 * clamps to 1 so the timer ring reads full instead of wrapping around.
 */
export const getHalfProgress = (
    match: TimedMatch | null | undefined,
    halfDurationMinutes: number,
    now: number,
): number => {
    if (!match?.startTime) return 0;

    const half = match.half ?? 1;
    const halfSeconds = halfDurationMinutes * 60;
    const withinHalf =
        getDisplaySeconds(match, halfDurationMinutes, now) -
        (half - 1) * halfSeconds;

    return Math.min(1, Math.max(0, withinHalf / halfSeconds));
};

/**
 * The time an ended match finished on. `endMatch` pauses the clock, so
 * `pausedAt` freezes it; matches ended before that fall back to the scheduled
 * full time, which is the best guess their document still allows.
 */
export const getFinalSeconds = (
    match: TimedMatch | null | undefined,
    halfDurationMinutes: number,
): number => {
    const half = match?.half ?? 2;

    return match?.pausedAt
        ? getDisplaySeconds(match, halfDurationMinutes, match.pausedAt)
        : half * halfDurationMinutes * 60;
};
