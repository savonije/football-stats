import dayjs from 'dayjs';

import type { Match } from '@/types';
import { hasKickoffTime } from '@/utils/date';

export interface KnvbMatch {
    code: number;
    date: Date;
    opponent: string;
    home: boolean;
}

export interface KnvbWarning {
    match: Match;
    knvb: KnvbMatch;
    field: 'opponent' | 'time' | 'date';
}

// KNVB writes "O10-1JM" where the season name may say "JO10-1".
export const normalizeTeamName = (name: string) =>
    name
        .toLowerCase()
        .replace(/\bjo(?=\d)/g, 'o')
        .replace(/[^a-z0-9]/g, '');

const sameOpponent = (a: string, b: string) => {
    const x = a.trim().toLowerCase();
    const y = b.trim().toLowerCase();
    return x.includes(y) || y.includes(x);
};

export const reconcileKnvbMatches = (
    existing: Match[],
    knvbMatches: KnvbMatch[],
) => {
    const toAdd: KnvbMatch[] = [];
    const warnings: KnvbWarning[] = [];

    for (const knvb of knvbMatches) {
        const byCode = existing.find((m) => m.knvbCode === knvb.code);
        const match =
            byCode ??
            existing.find(
                (m) =>
                    m.knvbCode == null &&
                    dayjs(m.date.toDate()).isSame(knvb.date, 'day'),
            );

        if (!match) {
            toAdd.push(knvb);
            continue;
        }

        const date = match.date.toDate();
        if (!sameOpponent(match.opponent, knvb.opponent)) {
            warnings.push({ match, knvb, field: 'opponent' });
        }
        if (byCode && !dayjs(date).isSame(knvb.date, 'day')) {
            warnings.push({ match, knvb, field: 'date' });
        } else if (
            hasKickoffTime(date) &&
            date.getTime() !== knvb.date.getTime()
        ) {
            warnings.push({ match, knvb, field: 'time' });
        }
    }

    return { toAdd, warnings };
};
