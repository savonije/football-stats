import type { Match } from '@/types';

/**
 * A match has been started once its timer has run at least once.
 * `startTime` is set by `startMatch` and never cleared, so it stays
 * truthy while the match is running, paused, or ended.
 */
export function hasStarted(
    match: Pick<Match, 'startTime'> | null | undefined,
): boolean {
    return !!match?.startTime;
}
