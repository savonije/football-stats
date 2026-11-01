<script setup lang="ts">
    import dayjs from 'dayjs';
    import { computed } from 'vue';
    import { RouterLink } from 'vue-router';

    import MatchInfoRow from '@/components/match/MatchInfoRow.vue';

    import { useMatchInfoRows } from '@/composables/useMatchInfoRows';
    import { useMatchStore } from '@/stores/matchStore';
    import { hasKickoffTime } from '@/utils/date';
    import { hasStarted } from '@/utils/match';

    const matchStore = useMatchStore();

    const nextMatch = computed(() => {
        const today = dayjs().startOf('day');

        return (
            [...matchStore.matches]
                .filter(
                    (match) =>
                        !hasStarted(match) &&
                        !match.ended &&
                        match.date &&
                        !dayjs(match.date.toDate()).isBefore(today),
                )
                .sort((a, b) => a.date.toMillis() - b.date.toMillis())[0] ??
            null
        );
    });

    const rows = useMatchInfoRows(() => nextMatch.value);

    const isLocation = (row: { icon: string }) =>
        row.icon === 'i-lucide-map-pin';
    const locationRow = computed(() => rows.value.find(isLocation));
    const otherRows = computed(() =>
        rows.value.filter((row) => !isLocation(row)),
    );

    const date = computed(() => nextMatch.value?.date.toDate());

    const formatDate = (options: Intl.DateTimeFormatOptions) =>
        date.value?.toLocaleDateString('nl-NL', options) ?? '';

    const kickoff = computed(() =>
        date.value && hasKickoffTime(date.value)
            ? dayjs(date.value).format('HH:mm')
            : '',
    );
</script>

<template>
    <div
        v-if="!matchStore.matchesLoaded"
        class="shadow-card rounded-xl bg-white p-5"
    >
        <h2>{{ $t('match.nextMatch') }}</h2>

        <div class="flex items-center gap-4">
            <USkeleton class="size-14 shrink-0 rounded-xl" />

            <div class="flex min-w-0 flex-1 flex-col gap-2">
                <USkeleton class="h-5 w-40" />
                <USkeleton class="h-4 w-24" />
            </div>
        </div>
    </div>

    <RouterLink
        v-else-if="nextMatch"
        class="shadow-card block overflow-hidden rounded-xl bg-white text-inherit no-underline"
        :to="{ name: 'matchDetail', params: { id: nextMatch.id } }"
    >
        <div class="px-4 py-5">
            <h2>{{ $t('match.nextMatch') }}</h2>

            <div class="flex items-center gap-4">
                <div
                    class="bg-primary-50 flex size-14 shrink-0 flex-col items-center justify-center rounded-xl"
                >
                    <span class="text-primary text-xl leading-none font-black">
                        {{ formatDate({ day: 'numeric' }) }}
                    </span>
                    <span
                        class="tracking-label text-xxs text-primary-600 font-mono font-bold uppercase"
                    >
                        {{ formatDate({ month: 'short' }) }}
                    </span>
                </div>

                <div class="min-w-0 flex-1">
                    <p class="text-primary-900 mb-0 truncate text-lg font-bold">
                        {{ nextMatch.opponent }}
                    </p>
                    <p class="mb-0 text-sm text-gray-600">
                        {{ formatDate({ weekday: 'long' }) }}
                        <template v-if="kickoff">· {{ kickoff }}</template>
                    </p>
                </div>

                <UBadge
                    class="tracking-badge text-xxs shrink-0 font-mono font-bold uppercase"
                    color="primary"
                    :label="
                        nextMatch.home ? $t('common.home') : $t('common.away')
                    "
                    variant="subtle"
                />
            </div>
        </div>

        <MatchInfoRow v-if="locationRow" compact :row="locationRow" />

        <div class="grid md:grid-cols-2">
            <MatchInfoRow
                v-for="row in otherRows"
                :key="row.icon"
                class="border-primary-100 md:odd:not-last:border-r md:odd:last:col-span-2"
                compact
                :row
            />
        </div>
    </RouterLink>
</template>
