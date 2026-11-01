import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { usePlayerStore } from '@/stores/playerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Match } from '@/types';

export interface MatchInfoRow {
    icon: string;
    label: string;
    value: string;
    href?: string;
    aside?: { value: string; label: string };
}

/** Sportlink fills in "3" or "Veld 3" alike; both should read "Veld 3". */
const withLabel = (value: string, label: string) =>
    `${label} ${value.replace(new RegExp(`^${label}\\s*`, 'i'), '')}`;

/** The practical details of a match (location, venue, referee, driving, washing). */
export const useMatchInfoRows = (match: () => Match | null) => {
    const { t } = useI18n();
    const playerStore = usePlayerStore();
    const settingsStore = useSettingsStore();

    const playerName = (id: string) =>
        playerStore.getPlayerById(id)?.name ?? '?';

    const venueRow = (m: Match): MatchInfoRow | null => {
        const field = t('match.venue.field');
        const dressingRoom = t('match.venue.dressingRoom');
        const parts = [
            m.field && withLabel(m.field, field),
            m.dressingRoom && withLabel(m.dressingRoom, dressingRoom),
        ].filter((part): part is string => !!part);

        if (!parts.length) return null;

        return {
            icon: 'i-lucide-shirt',
            label:
                parts.length === 2
                    ? t('match.venue.fieldAndDressingRoom')
                    : m.field
                      ? field
                      : dressingRoom,
            value: parts.join(' · '),
        };
    };

    const drivingRow = (m: Match): MatchInfoRow | null => {
        const driving =
            settingsStore.drivingEnabled && !m.home ? m.driving : null;
        if (!driving?.drivers?.length && !driving?.meetingTime) return null;

        return {
            icon: 'i-lucide-car',
            label: t('driving.drivers'),
            value:
                driving.drivers?.map(playerName).join(', ') ||
                t('driving.notPlanned'),
            aside: driving.meetingTime
                ? {
                      value: driving.meetingTime,
                      label: t('driving.meetingLabel'),
                  }
                : undefined,
        };
    };

    return computed(() => {
        const m = match();
        if (!m) return [];

        return [
            m.location
                ? {
                      icon: 'i-lucide-map-pin',
                      label: t('match.venue.location'),
                      value: m.location,
                      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location)}`,
                  }
                : null,
            venueRow(m),
            m.referee
                ? {
                      icon: 'i-lucide-whistle',
                      label: t('match.referee'),
                      value: m.referee,
                  }
                : null,
            drivingRow(m),
            settingsStore.washingEnabled && m.washing
                ? {
                      icon: 'i-lucide-washing-machine',
                      label: t('washing.washer'),
                      value: playerName(m.washing),
                  }
                : null,
        ].filter((row): row is MatchInfoRow => !!row);
    });
};
