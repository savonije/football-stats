<script setup lang="ts">
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { usePlayerStore } from '@/stores/playerStore';
    import { useSettingsStore } from '@/stores/settingsStore';
    import type { Match } from '@/types';
    import { isPlayed } from '@/utils/match';

    interface Row {
        icon: string;
        label: string;
        value: string;
        href?: string;
        aside?: { value: string; label: string };
    }

    const { match } = defineProps<{ match: Match }>();

    const { t } = useI18n();
    const playerStore = usePlayerStore();
    const settingsStore = useSettingsStore();

    /** Sportlink fills in "3" or "Veld 3" alike; both should read "Veld 3". */
    const withLabel = (value: string, label: string) =>
        `${label} ${value.replace(new RegExp(`^${label}\\s*`, 'i'), '')}`;

    const playerName = (id: string) =>
        playerStore.getPlayerById(id)?.name ?? '?';

    const venueRow = computed((): Row | null => {
        const field = t('match.venue.field');
        const dressingRoom = t('match.venue.dressingRoom');
        const parts = [
            match.field && withLabel(match.field, field),
            match.dressingRoom && withLabel(match.dressingRoom, dressingRoom),
        ].filter((part): part is string => !!part);

        if (!parts.length) return null;

        return {
            icon: 'i-lucide-shirt',
            label:
                parts.length === 2
                    ? t('match.venue.fieldAndDressingRoom')
                    : match.field
                      ? field
                      : dressingRoom,
            value: parts.join(' · '),
        };
    });

    const drivingRow = computed((): Row | null => {
        const driving =
            settingsStore.drivingEnabled && !match.home ? match.driving : null;
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
    });

    const rows = computed(() =>
        [
            match.location
                ? {
                      icon: 'i-lucide-map-pin',
                      label: t('match.venue.location'),
                      value: match.location,
                      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.location)}`,
                  }
                : null,
            venueRow.value,
            drivingRow.value,
            settingsStore.washingEnabled && match.washing
                ? {
                      icon: 'i-lucide-washing-machine',
                      label: t('washing.washer'),
                      value: playerName(match.washing),
                  }
                : null,
        ].filter((row): row is Row => !!row),
    );
</script>

<template>
    <details
        v-if="rows.length"
        class="group shadow-card mt-4 overflow-hidden rounded-xl bg-white"
        :open="!isPlayed(match)"
        data-testid="match-info"
    >
        <summary
            class="flex cursor-pointer list-none items-center gap-3.5 px-4 py-3.5 [&::-webkit-details-marker]:hidden"
        >
            <span
                class="bg-primary-50 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
            >
                <UIcon class="size-4.5" name="i-lucide-info" />
            </span>

            <span class="text-primary-900 flex-1 font-bold">
                {{ t('match.practical') }}
            </span>

            <UIcon
                class="text-primary-600 size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                name="i-lucide-chevron-down"
            />
        </summary>

        <component
            :is="row.href ? 'a' : 'div'"
            v-for="row in rows"
            :key="row.icon"
            class="border-primary-100 flex items-center gap-3.5 border-t px-4 py-3.5 text-inherit no-underline"
            v-bind="
                row.href && {
                    href: row.href,
                    target: '_blank',
                    rel: 'noopener',
                }
            "
        >
            <span
                class="bg-primary-50 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
            >
                <UIcon class="size-4.5" :name="row.icon" />
            </span>

            <span class="flex min-w-0 flex-1 flex-col">
                <span class="text-xs text-gray-600">{{ row.label }}</span>
                <span class="text-primary-900 font-bold">{{ row.value }}</span>
            </span>

            <span v-if="row.aside" class="flex shrink-0 flex-col items-end">
                <span class="text-primary-900 font-extrabold tabular-nums">
                    {{ row.aside.value }}
                </span>
                <span class="text-xs text-gray-600">
                    {{ row.aside.label }}
                </span>
            </span>

            <UIcon
                v-if="row.href"
                class="text-primary-600 size-5 shrink-0"
                name="i-lucide-chevron-right"
            />
        </component>
    </details>
</template>
