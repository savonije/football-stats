import dayjs from 'dayjs';

import type { Appearance, Match, Player } from '@/types';
import {
    isAlwaysDriverInSeason,
    isNeverDriverInSeason,
} from '@/utils/playerSeason';

export interface DrivingPlan {
    match: Match;
    past: boolean;
    squadSize: number;
    needed: number;
    drivers: string[];
    /** False while `drivers` is a proposal that still has to be written. */
    saved: boolean;
    /** Who the rotation would add next. */
    next: string | null;
}

export interface DriveCount {
    driven: number;
    planned: number;
}

/**
 * Stored drivers are the plan. An upcoming away match with a squad but no
 * drivers yet gets a proposal, in date order: vaste rijders first, then
 * whoever has driven least. A passed match that was never planned is left out.
 */
export const planDriving = (
    matches: Match[],
    appearances: Appearance[],
    players: Player[],
    seasonId: string,
    playersPerCar: number,
    now = new Date(),
) => {
    const awayMatches = matches.filter((match) => !match.home && match.date);
    const playersById = new Map(players.map((p) => [p.id, p]));
    const counts = new Map<string, DriveCount>(
        players.map((p) => [p.id, { driven: 0, planned: 0 }]),
    );

    const isPast = (match: Match) =>
        dayjs(match.date.toDate()).isBefore(now, 'day');

    const squadOf = (match: Match) =>
        appearances
            .filter((a) => a.present && a.matchId === match.id)
            .map((a) => a.playerId);

    const count = (drivers: string[], past: boolean) => {
        for (const id of drivers) {
            const total = counts.get(id);
            if (total) total[past ? 'driven' : 'planned'] += 1;
        }
    };

    const total = (id: string) => {
        const c = counts.get(id);
        return c ? c.driven + c.planned : 0;
    };

    const candidates = (match: Match, squad: string[], drivers: string[]) =>
        squad
            .filter(
                (id) =>
                    !drivers.includes(id) &&
                    !match.driving?.excluded?.includes(id),
            )
            .flatMap((id) => playersById.get(id) ?? [])
            .filter((p) => !isNeverDriverInSeason(p, seasonId))
            .sort(
                (a, b) =>
                    Number(isAlwaysDriverInSeason(b, seasonId)) -
                        Number(isAlwaysDriverInSeason(a, seasonId)) ||
                    total(a.id) - total(b.id) ||
                    a.name.localeCompare(b.name),
            )
            .map((p) => p.id);

    for (const match of awayMatches) {
        if (match.driving?.drivers) count(match.driving.drivers, isPast(match));
    }

    const plans = awayMatches
        .sort((a, b) => a.date.toMillis() - b.date.toMillis())
        .flatMap((match): DrivingPlan[] => {
            const past = isPast(match);
            const squad = squadOf(match);
            const needed = Math.ceil(squad.length / playersPerCar);
            const saved = !!match.driving?.drivers;

            if (!saved && (past || !squad.length)) return [];

            const drivers =
                match.driving?.drivers ??
                candidates(match, squad, []).slice(0, needed);
            if (!saved) count(drivers, past);

            return [
                {
                    match,
                    past,
                    squadSize: squad.length,
                    needed,
                    drivers,
                    saved,
                    next: candidates(match, squad, drivers)[0] ?? null,
                },
            ];
        });

    return { plans, counts };
};
