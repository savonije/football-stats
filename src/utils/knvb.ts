import dayjs from 'dayjs';

import type { Match, MatchVenue } from '@/types';

export interface KnvbMatch {
    code: number;
    date: Date;
    opponent: string;
    home: boolean;
    venue: Required<MatchVenue>;
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

const VENUE_FIELDS = ['location', 'field', 'dressingRoom'] as const;

const differs = (match: Match, knvb: KnvbMatch) =>
    !sameOpponent(match.opponent, knvb.opponent) ||
    match.home !== knvb.home ||
    match.date.toDate().getTime() !== knvb.date.getTime() ||
    VENUE_FIELDS.some((field) => (match[field] ?? '') !== knvb.venue[field]);

export const reconcileKnvbMatches = (
    existing: Match[],
    knvbMatches: KnvbMatch[],
) => {
    const toAdd: KnvbMatch[] = [];
    const toUpdate: { match: Match; knvb: KnvbMatch }[] = [];

    for (const knvb of knvbMatches) {
        const match =
            existing.find((m) => m.knvbCode === knvb.code) ??
            existing.find(
                (m) =>
                    m.knvbCode == null &&
                    dayjs(m.date.toDate()).isSame(knvb.date, 'day'),
            );

        if (!match) toAdd.push(knvb);
        else if (differs(match, knvb)) toUpdate.push({ match, knvb });
    }

    return { toAdd, toUpdate };
};
