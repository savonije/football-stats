<script setup lang="ts">
    import { computed } from 'vue';

    const { players } = defineProps<{
        players: { id: string; name: string; totalGoals: number }[];
    }>();

    const SEGMENT_COLORS = [
        'bg-primary-700',
        'bg-primary-600',
        'bg-primary-500',
        'bg-primary-400',
        'bg-primary-300',
        'bg-primary-200',
    ];

    const total = computed(() =>
        players.reduce((sum, player) => sum + player.totalGoals, 0),
    );

    const segments = computed(() =>
        players.map((player, index) => ({
            id: player.id,
            label: player.name.split(' ')[0],
            goals: player.totalGoals,
            color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        })),
    );
</script>

<template>
    <div
        v-if="total > 0"
        class="shadow-card mb-6 flex flex-col gap-3.5 rounded-2xl bg-white p-5"
    >
        <div class="tracking-label text-primary text-sm font-bold">
            {{ $t('common.goalDistribution') }}
        </div>

        <div class="flex h-3 gap-0.5 overflow-hidden rounded-full">
            <span
                v-for="segment in segments"
                :key="segment.id"
                class="block"
                :class="segment.color"
                :style="{ width: `${(segment.goals / total) * 100}%` }"
            />
        </div>

        <div class="flex flex-wrap gap-x-3.5 gap-y-2.5">
            <span
                v-for="segment in segments"
                :key="segment.id"
                class="flex items-center gap-1.5"
            >
                <span class="size-2.5 rounded-sm" :class="segment.color" />
                <span class="text-primary-400 text-xs">
                    {{ segment.label }} {{ segment.goals }}
                </span>
            </span>
        </div>
    </div>
</template>
