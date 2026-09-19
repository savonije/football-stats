<script setup lang="ts">
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
            rank: 1,
            order: 'sm:order-2',
            badge: 'bg-amber-100 text-amber-800',
            ring: 'border-amber',
            avatar: 'size-11 text-base sm:size-14 sm:text-lg',
            goals: 'text-2xl sm:text-4xl',
            padding: 'p-3 sm:p-4',
        },
        {
            rank: 2,
            order: 'sm:order-1',
            badge: 'bg-gray-100 text-gray-700',
            ring: 'border-gray-400',
            avatar: 'size-11 text-base',
            goals: 'text-2xl',
            padding: 'p-3',
        },
        {
            rank: 3,
            order: 'sm:order-3',
            badge: 'bg-orange-100 text-amber-800',
            ring: 'border-amber-700',
            avatar: 'size-11 text-base',
            goals: 'text-2xl',
            padding: 'p-3',
        },
    ];
</script>

<template>
    <div
        v-if="players.length === 3"
        class="mb-6 flex flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:items-end sm:gap-4"
    >
        <RouterLink
            v-for="step in PODIUM"
            :key="step.rank"
            class="shadow-card flex items-center gap-3 rounded-2xl bg-white sm:flex-col sm:gap-2"
            :class="[step.order, step.padding]"
            :to="{
                name: 'playerDetail',
                params: { id: players[step.rank - 1].id },
            }"
        >
            <span
                class="text-xxs flex h-5 w-6.5 shrink-0 items-center justify-center rounded-full font-bold sm:order-1"
                :class="step.badge"
            >
                {{ step.rank }}
            </span>

            <span
                class="from-primary-500 to-primary-700 flex shrink-0 items-center justify-center rounded-full border-[3px] bg-linear-to-br font-bold text-white sm:order-2"
                :class="[step.avatar, step.ring]"
            >
                {{ players[step.rank - 1].name.charAt(0).toUpperCase() }}
            </span>

            <span class="flex min-w-0 flex-1 flex-col sm:contents">
                <span
                    class="text-primary-950 truncate text-sm leading-tight font-semibold sm:order-3 sm:text-center sm:whitespace-normal"
                >
                    {{ players[step.rank - 1].name }}
                </span>

                <span class="text-primary-400 text-xs sm:order-5">
                    {{ players[step.rank - 1].matchCount }}
                    {{
                        $t(
                            'match.game',
                            players[step.rank - 1].matchCount,
                        ).toLowerCase()
                    }}
                </span>
            </span>

            <span class="flex shrink-0 items-baseline gap-1 sm:order-4">
                <span
                    class="text-primary-700 leading-none font-black"
                    :class="step.goals"
                >
                    {{ players[step.rank - 1].totalGoals }}
                </span>
                <span
                    class="text-xxs tracking-label text-primary-400 font-bold uppercase"
                >
                    {{ $t('common.goal', players[step.rank - 1].totalGoals) }}
                </span>
            </span>
        </RouterLink>
    </div>
</template>
