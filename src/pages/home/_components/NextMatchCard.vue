<script setup lang="ts">
    import dayjs from 'dayjs';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { RouterLink } from 'vue-router';

    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { hasStarted } from '@/utils/match';

    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const { t } = useI18n();

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

    const date = computed(() => nextMatch.value?.date.toDate());

    const formatDate = (options: Intl.DateTimeFormatOptions) =>
        date.value?.toLocaleDateString('nl-NL', options) ?? '';

    const washerName = computed(() => {
        const washing = nextMatch.value?.washing;
        const player = washing ? playerStore.getPlayerById(washing) : null;

        return player?.name ?? t('washing.notAssigned');
    });
</script>

<template>
    <div
        v-if="!matchStore.matchesLoaded"
        class="shadow-card rounded-xl bg-white p-5"
    >
        <h2>{{ t('match.nextMatch') }}</h2>

        <div class="flex items-center gap-4">
            <USkeleton class="size-14 shrink-0 rounded-xl" />

            <div class="flex min-w-0 flex-1 flex-col gap-2">
                <USkeleton class="h-5 w-40" />
                <USkeleton class="h-4 w-24" />
            </div>
        </div>

        <div
            class="border-primary-100 mt-4 flex items-center justify-between border-t pt-3"
        >
            <USkeleton class="h-4 w-20" />
            <USkeleton class="h-4 w-24" />
        </div>
    </div>

    <RouterLink
        v-else-if="nextMatch"
        class="shadow-card block rounded-xl bg-white p-5 text-inherit no-underline"
        :to="{ name: 'matchDetail', params: { id: nextMatch.id } }"
    >
        <h2>{{ t('match.nextMatch') }}</h2>

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
                </p>
            </div>

            <UBadge
                class="tracking-badge text-xxs shrink-0 font-mono font-bold uppercase"
                color="primary"
                :label="nextMatch.home ? t('common.home') : t('common.away')"
                variant="subtle"
            />
        </div>

        <div
            class="border-primary-100 mt-4 flex items-center justify-between border-t pt-3 text-sm"
        >
            <span class="font-semibold text-gray-600">
                {{ t('washing.washer') }}
            </span>
            <span class="text-primary-900 font-bold">{{ washerName }}</span>
        </div>
    </RouterLink>
</template>
