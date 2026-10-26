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
    squad: string[];
    driving?: MatchDriving;
}

export interface Car {
    playerId: string | null;
    extraIndex: number | null;
    picked: boolean;
    alwaysDrives: boolean;
}

export interface DrivingPlan {
    matchId: string;
    past: boolean;
    squadSize: number;
    needed: number;
    cars: Car[];
    next: string | null;
}

export interface DriveCount {
    driven: number;
    planned: number;
}

export const planDriving = (
    matches: DrivingMatch[],
    players: DrivingPlayer[],
    now = new Date(),
) => {
    const playersById = new Map(players.map((p) => [p.id, p]));
    const counts = new Map<string, DriveCount>(
        players.map((p) => [p.id, { driven: 0, planned: 0 }]),
    );

    const total = (id: string) => {
        const count = counts.get(id);
        return count ? count.driven + count.planned : 0;
    };

    const byLeastDriven = (a: DrivingPlayer, b: DrivingPlayer) =>
        total(a.id) - total(b.id) || a.name.localeCompare(b.name);

    const plans = [...matches]
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((match): DrivingPlan => {
            const past = dayjs(match.date).isBefore(now, 'day');
            const needed = Math.ceil(match.squad.length / PLAYERS_PER_CAR);
            const {
                excluded = [],
                extraCars = [],
                drivers,
                alwaysDrives,
            } = match.driving ?? {};

            const isAlwaysDriver = (id: string | null) =>
                !!id &&
                (alwaysDrives?.includes(id) ??
                    playersById.get(id)?.alwaysDrives ??
                    false);

            let cars: Car[];
            let next: string | null = null;

            if (past && drivers) {
                cars = drivers.map((playerId) => ({
                    playerId,
                    extraIndex: null,
                    picked: false,
                    alwaysDrives: false,
                }));
            } else {
                const queue = match.squad
                    .filter(
                        (id) =>
                            !excluded.includes(id) && !extraCars.includes(id),
                    )
                    .flatMap((id) => playersById.get(id) ?? [])
                    .sort(
                        (a, b) =>
                            Number(isAlwaysDriver(b.id)) -
                                Number(isAlwaysDriver(a.id)) ||
                            byLeastDriven(a, b),
                    )
                    .map((p) => p.id);

                cars = [
                    ...Array.from({ length: needed }, () => {
                        const playerId = queue.shift() ?? null;
                        return {
                            playerId,
                            extraIndex: null,
                            picked: false,
                            alwaysDrives: isAlwaysDriver(playerId),
                        };
                    }),
                    ...extraCars.map((id, extraIndex) => ({
                        playerId: id ?? queue.shift() ?? null,
                        extraIndex,
                        picked: id !== null,
                        alwaysDrives: false,
                    })),
                ];
                next = queue[0] ?? null;
            }

            for (const { playerId } of cars) {
                const count = playerId ? counts.get(playerId) : undefined;
                if (count) count[past ? 'driven' : 'planned'] += 1;
            }

            return {
                matchId: match.id,
                past,
                squadSize: match.squad.length,
                needed,
                cars,
                next,
            };
        });

    return { plans, counts };
};
