import type { Match } from '@/types';

/**
 * A match has been started once its timer has run at least once.
 * `startTime` is set by `startMatch` and never cleared, so it stays
 * truthy while the match is running, paused, or ended.
 */
export const hasStarted = (
    match: Pick<Match, 'startTime'> | null | undefined,
): boolean => !!match?.startTime;

type TimedMatch = Pick<
    Match,
    'startTime' | 'paused' | 'pausedAt' | 'pausedDuration' | 'half'
>;

/**
 * Running elapsed time (ms) within the current half, excluding paused time.
 * `startTime`/`pausedDuration` are reset when a half starts, so this always
 * measures from the start of the current half.
 */
export const getElapsedMs = (
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
