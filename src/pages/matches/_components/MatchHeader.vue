<script setup lang="ts">
    import dayjs from 'dayjs';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import MatchActionsMenu from '@/pages/matches/_components/MatchActionsMenu.vue';

    import { CLUBNAME } from '@/constants';
    import type { Match } from '@/types';
    import { hasKickoffTime } from '@/utils/date';

    const { match } = defineProps<{ match: Match }>();
    const emit = defineEmits<{ addPlayers: [] }>();

    const { t } = useI18n();

    const dateLabel = computed(() => {
        const date = match.date.toDate();
        return dayjs(date).format(
            hasKickoffTime(date) ? 'D MMMM YYYY, HH:mm' : 'D MMMM YYYY',
        );
    });

    const fieldLabel = (field: string) =>
        /^veld/i.test(field)
            ? field.replace(/^v/, 'V')
            : `${t('match.venue.field')} ${field}`;

    const meta = computed(() =>
        [
            { icon: 'i-lucide-calendar', label: dateLabel.value },
            {
                icon: 'i-lucide-map-pin',
                label: match.location,
                href:
                    match.location &&
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.location)}`,
            },
            {
                icon: 'i-lucide-goal',
                label: match.field && fieldLabel(match.field),
            },
            {
                icon: 'i-lucide-shirt',
                label:
                    match.dressingRoom &&
                    `${t('match.venue.dressingRoom')} ${match.dressingRoom}`,
            },
        ].filter((item) => item.label),
    );

    /** The home side is named first, which is what says home or away. */
    const title = computed(() =>
        match.home
            ? `${CLUBNAME} - ${match.opponent}`
            : `${match.opponent} - ${CLUBNAME}`,
    );
</script>

<template>
    <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
            <h1 class="text-primary mb-0 text-2xl sm:text-3xl">
                {{ title }}
            </h1>

            <ul
                class="text-primary-400 my-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium"
                data-testid="match-meta"
            >
                <li v-for="item in meta" :key="item.icon">
                    <component
                        :is="item.href ? 'a' : 'span'"
                        class="flex items-center gap-1.5"
                        :class="{
                            'hover:text-primary underline-offset-2 hover:underline':
                                item.href,
                        }"
                        v-bind="
                            item.href && {
                                href: item.href,
                                target: '_blank',
                                rel: 'noopener',
                            }
                        "
                    >
                        <UIcon :name="item.icon" class="size-4 shrink-0" />
                        {{ item.label }}
                    </component>
                </li>
            </ul>
        </div>

        <MatchActionsMenu :match="match" @add-players="emit('addPlayers')" />
    </div>
</template>
