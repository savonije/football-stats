<script setup lang="ts">
    import { computed } from 'vue';
    import { RouterLink } from 'vue-router';

    const { players } = defineProps<{
        players: {
            id: string;
            name: string;
            totalGoals: number;
            matchCount: number;
        }[];
    }>();

    const PODIUM = [
        {
            order: 'sm:order-2',
            badge: 'bg-amber-100 text-amber-800',
            ring: 'border-amber',
        },
        {
            order: 'sm:order-1',
            badge: 'bg-gray-100 text-gray-700',
            ring: 'border-gray-400',
        },
        {
            order: 'sm:order-3',
            badge: 'bg-orange-100 text-amber-800',
            ring: 'border-amber-700',
        },
    ];

    const steps = computed(() =>
        players.map((player, index) => ({
            ...player,
            ...PODIUM[index],
            rank: index + 1,
            winner: index === 0,
        })),
    );
</script>

<template>
    <div
        v-if="players.length === 3"
        class="mb-6 flex flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:items-end sm:gap-4"
    >
        <RouterLink
            v-for="step in steps"
            :key="step.id"
            class="shadow-card flex items-center gap-3 rounded-2xl bg-white p-3 sm:flex-col sm:gap-2"
            :class="[step.order, step.winner && 'sm:p-4']"
            :to="{ name: 'playerDetail', params: { id: step.id } }"
        >
            <span
                class="text-xxs flex h-5 w-6.5 shrink-0 items-center justify-center rounded-full font-bold sm:order-1"
                :class="step.badge"
            >
                {{ step.rank }}
            </span>

            <span
                class="from-primary-500 to-primary-700 flex size-11 shrink-0 items-center justify-center rounded-full border-[3px] bg-linear-to-br text-base font-bold text-white sm:order-2"
                :class="[step.ring, step.winner && 'sm:size-14 sm:text-lg']"
            >
                {{ step.name.charAt(0).toUpperCase() }}
            </span>

            <span class="flex min-w-0 flex-1 flex-col sm:contents">
                <span
                    class="text-primary-950 truncate text-sm leading-tight font-semibold sm:order-3 sm:text-center sm:whitespace-normal"
                >
                    {{ step.name }}
                </span>

                <span class="text-primary-400 text-xs sm:order-5">
                    {{ step.matchCount }}
                    {{ $t('match.game', step.matchCount).toLowerCase() }}
                </span>
            </span>

            <span class="flex shrink-0 items-baseline gap-1 sm:order-4">
                <span
                    class="text-primary-700 text-2xl leading-none font-black"
                    :class="step.winner && 'sm:text-4xl'"
                >
                    {{ step.totalGoals }}
                </span>
            </span>
        </RouterLink>
    </div>
</template>
