import type { Player, PlayerSeasonInfo } from '@/types';

/**
 * Per-season player status helpers.
 *
 * A player's participation is stored on the player document under a `seasons`
 * map keyed by season id. A player is part of a season only when that season's
 * entry exists and `active` is true; `guestPlayer` is only meaningful when the
 * player is active in that season.
 */

export function playerSeasonInfo(
    player: Player,
    seasonId: string,
): PlayerSeasonInfo | undefined {
    return player.seasons?.[seasonId];
}

export function isActiveInSeason(player: Player, seasonId: string): boolean {
    return playerSeasonInfo(player, seasonId)?.active === true;
}

export function isGuestInSeason(player: Player, seasonId: string): boolean {
    return playerSeasonInfo(player, seasonId)?.guestPlayer === true;
}
