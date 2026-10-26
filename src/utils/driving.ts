import dayjs from 'dayjs';

import { PLAYERS_PER_CAR } from '@/constants';
import type { MatchDriving } from '@/types';

export interface DrivingPlayer {
    id: string;
    name: string;
    alwaysDrives: boolean;
}

export interface DrivingMatch {
    id: string;
    date: Date;
    /** Ids of the players going to the match. */
    squad: string[];
    driving?: MatchDriving;
}

export interface DrivingPlan {
    matchId: string;
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
 * Stored drivers are the plan. An upcoming match with a squad but no drivers
 * yet gets a proposal, in date order: vaste rijders first, then whoever has
 * driven least. A passed match that was never planned is left out.
 */
export const planDriving = (
    matches: DrivingMatch[],
    players: DrivingPlayer[],
    now = new Date(),
) => {
    const playersById = new Map(players.map((p) => [p.id, p]));
    const counts = new Map<string, DriveCount>(
        players.map((p) => [p.id, { driven: 0, planned: 0 }]),
    );

    const isPast = (match: DrivingMatch) =>
        dayjs(match.date).isBefore(now, 'day');

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

    const candidates = (match: DrivingMatch, drivers: string[]) =>
        match.squad
            .filter(
                (id) =>
                    !drivers.includes(id) &&
                    !match.driving?.excluded?.includes(id),
            )
            .flatMap((id) => playersById.get(id) ?? [])
            .sort(
                (a, b) =>
                    Number(b.alwaysDrives) - Number(a.alwaysDrives) ||
                    total(a.id) - total(b.id) ||
                    a.name.localeCompare(b.name),
            )
            .map((p) => p.id);

    for (const match of matches) {
        if (match.driving?.drivers) count(match.driving.drivers, isPast(match));
    }

    const plans = [...matches]
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .flatMap((match): DrivingPlan[] => {
            const past = isPast(match);
            const needed = Math.ceil(match.squad.length / PLAYERS_PER_CAR);
            const saved = !!match.driving?.drivers;

            if (!saved && (past || !match.squad.length)) return [];

            const drivers =
                match.driving?.drivers ??
                candidates(match, []).slice(0, needed);
            if (!saved) count(drivers, past);

            return [
                {
                    matchId: match.id,
                    past,
                    squadSize: match.squad.length,
                    needed,
                    drivers,
                    saved,
                    next: candidates(match, drivers)[0] ?? null,
                },
            ];
        });

    return { plans, counts };
};
