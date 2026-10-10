import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase';
import type { Match } from '@/types';
import { normalizeTeamName, type KnvbMatch } from '@/utils/knvb';

const BASE_URL = 'https://data.sportlink.com';

const get = async <T>(
    path: string,
    clientId: string,
    params: Record<string, string> = {},
) => {
    const query = new URLSearchParams({ ...params, client_id: clientId });
    const response = await fetch(`${BASE_URL}/${path}?${query}`);
    if (!response.ok) throw new Error(`Sportlink ${path}: ${response.status}`);
    return (await response.json()) as T;
};

const titleCase = (text: string) =>
    text
        .toLowerCase()
        .replace(/(^|[\s-])\p{L}/gu, (char) => char.toUpperCase());

/** Resolves the season team name (e.g. "JO10-1") to a KNVB teamcode. */
const findTeamCode = async (clientId: string, teamName: string) => {
    const teams = await get<{ teamcode: number; teamnaam: string }[]>(
        'teams',
        clientId,
    );
    const wanted = normalizeTeamName(teamName);
    const named = teams.map((team) => ({
        code: team.teamcode,
        name: normalizeTeamName(team.teamnaam),
    }));
    const exact = named.filter((team) => team.name === wanted);
    const candidates = exact.length
        ? exact
        : named.filter((team) => wanted && team.name.includes(wanted));
    const codes = [...new Set(candidates.map((team) => team.code))];

    return codes.length === 1 ? codes[0]! : null;
};

export const fetchKnvbMatches = async (
    clientId: string,
    teamName: string,
): Promise<KnvbMatch[] | null> => {
    const teamCode = await findTeamCode(clientId, teamName);
    if (teamCode === null) return null;

    const programma = await get<
        {
            wedstrijdcode: number;
            wedstrijddatum: string;
            thuisteam: string;
            thuisteamid: number;
            uitteam: string;
            status: string;
            accommodatie?: string;
            plaats?: string;
            veld?: string;
            kleedkamerthuisteam?: string;
            kleedkameruitteam?: string;
        }[]
    >('programma', clientId, {
        teamcode: String(teamCode),
        aantaldagen: '250',
        eigenwedstrijden: 'JA',
    });

    const now = Date.now();

    return programma
        .filter((m) => m.status === 'Te spelen')
        .map((m) => {
            const home = m.thuisteamid === teamCode;
            return {
                code: m.wedstrijdcode,
                date: new Date(m.wedstrijddatum),
                opponent: home ? m.uitteam : m.thuisteam,
                home,
                venue: {
                    location: [
                        m.accommodatie?.trim(),
                        m.plaats && titleCase(m.plaats.trim()),
                    ]
                        .filter(Boolean)
                        .join(', '),
                    field: m.veld?.trim() ?? '',
                    dressingRoom:
                        (home
                            ? m.kleedkamerthuisteam
                            : m.kleedkameruitteam
                        )?.trim() ?? '',
                },
            };
        })
        .filter((m) => m.date.getTime() >= now);
};

export const fetchSeasonMatches = async (seasonId: string) => {
    const snapshot = await getDocs(
        collection(db, 'seasons', seasonId, 'matches'),
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Match);
};

/** The KNVB wins: an existing match is overwritten with its schedule. */
export const applyKnvbMatch = (
    seasonId: string,
    matchId: string,
    knvb: KnvbMatch,
) =>
    updateDoc(doc(db, 'seasons', seasonId, 'matches', matchId), {
        opponent: knvb.opponent,
        date: knvb.date,
        home: knvb.home,
        knvbCode: knvb.code,
        ...knvb.venue,
    });
