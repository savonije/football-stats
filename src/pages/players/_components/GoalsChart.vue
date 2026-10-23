<script setup lang="ts">
    import { useElementSize } from '@vueuse/core';
    import { computed, useTemplateRef } from 'vue';
    import { useI18n } from 'vue-i18n';

    interface DataPoint {
        goals: number;
        opponent: string;
    }

    const { data } = defineProps<{
        data: DataPoint[];
    }>();

    const { t } = useI18n();

    const MIN_COL_WIDTH = 60;
    const PAD_X = 32;
    const PAD_T = 30;
    const PAD_B = 12;

    const { width: containerWidth, height: containerHeight } = useElementSize(
        useTemplateRef('container'),
    );

    // Grows with the card when the grid row is stretched by a taller
    // neighbour (the admin-only info card), so no white strip is left below.
    const H = computed(() => containerHeight.value);
    const chartH = computed(() => H.value - PAD_T - PAD_B);

    // Stretch to the card, but never squeeze matches closer than
    // MIN_COL_WIDTH — past that the container scrolls instead.
    const svgWidth = computed(() =>
        Math.max(
            containerWidth.value,
            PAD_X * 2 + Math.max(data.length - 1, 1) * MIN_COL_WIDTH,
        ),
    );

    const maxGoals = computed(() => Math.max(...data.map((d) => d.goals), 1));

    const points = computed(() => {
        const n = data.length;
        const innerW = svgWidth.value - PAD_X * 2;
        return data.map((d, i) => ({
            ...d,
            x: PAD_X + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1)),
            y: PAD_T + chartH.value - (d.goals / maxGoals.value) * chartH.value,
        }));
    });

    // The line runs flat out to both edges so the fill bleeds to the card's
    // sides, while the dots themselves stay inset by PAD_X.
    const polylinePoints = computed(() =>
        [
            `0,${points.value[0].y}`,
            ...points.value.map((p) => `${p.x},${p.y}`),
            `${svgWidth.value},${points.value.at(-1)!.y}`,
        ].join(' '),
    );

    const areaPoints = computed(
        () =>
            `0,${H.value} ${polylinePoints.value} ${svgWidth.value},${H.value}`,
    );
</script>

<template>
    <div v-if="data.length === 0" class="p-6 text-center text-gray-400">
        {{ t('player.noMatchData') }}
    </div>

    <div
        v-else
        ref="container"
        class="relative min-h-45 flex-1 overflow-x-auto [direction:rtl]"
    >
        <!-- Absolute so the svg never props the container open itself:
             its height follows the container, not the other way round. -->
        <svg
            class="absolute inset-y-0 right-0 [direction:ltr]"
            :width="svgWidth"
            :height="H"
            :viewBox="`0 0 ${svgWidth} ${H}`"
            role="img"
        >
            <polygon
                :points="areaPoints"
                fill="var(--color-primary-100)"
                opacity="0.6"
            />

            <polyline
                :points="polylinePoints"
                fill="none"
                stroke="var(--color-primary-500)"
                stroke-width="2.5"
                stroke-linejoin="round"
                stroke-linecap="round"
            />

            <g v-for="(p, i) in points" :key="i">
                <text
                    :x="p.x"
                    :y="p.y - 10"
                    text-anchor="middle"
                    font-size="16"
                    font-weight="600"
                    fill="var(--color-primary-700)"
                >
                    {{ p.goals }}
                </text>

                <UTooltip :content="{ side: 'top' }" :text="p.opponent">
                    <circle
                        :cx="p.x"
                        :cy="p.y"
                        r="10"
                        fill="transparent"
                        style="cursor: pointer"
                        tabindex="0"
                    />
                </UTooltip>
                <circle
                    :cx="p.x"
                    :cy="p.y"
                    r="4"
                    fill="var(--color-primary-500)"
                    stroke="white"
                    stroke-width="2"
                    style="pointer-events: none"
                />
            </g>
        </svg>
    </div>
</template>
