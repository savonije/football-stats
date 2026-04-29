<script setup lang="ts">
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import Tooltip from 'primevue/tooltip';

    interface DataPoint {
        goals: number;
        opponent: string;
    }

    const props = defineProps<{
        data: DataPoint[];
    }>();

    const { t } = useI18n();

    const vTooltip = Tooltip;

    const COL_WIDTH = 90;
    const H = 230;
    const PAD_L = 30;
    const PAD_R = 30;
    const PAD_T = 30;
    const PAD_B = 20;

    const chartH = H - PAD_T - PAD_B;

    const svgWidth = computed(() => {
        const n = props.data.length;
        return PAD_L + PAD_R + Math.max(n - 1, 1) * COL_WIDTH;
    });

    const maxGoals = computed(() =>
        Math.max(...props.data.map((d) => d.goals), 1),
    );

    const points = computed(() =>
        props.data.map((d, i) => {
            const n = props.data.length;
            const innerW = svgWidth.value - PAD_L - PAD_R;
            const x = PAD_L + (n === 1 ? innerW / 2 : i * COL_WIDTH);
            const y = PAD_T + chartH - (d.goals / maxGoals.value) * chartH;
            return { x, y, goals: d.goals, opponent: d.opponent };
        }),
    );

    const polylinePoints = computed(() =>
        points.value.map((p) => `${p.x},${p.y}`).join(' '),
    );

    const areaPoints = computed(() => {
        if (points.value.length === 0) return '';
        const bottom = PAD_T + chartH;
        return `${points.value[0].x},${bottom} ${polylinePoints.value} ${points.value[points.value.length - 1].x},${bottom}`;
    });
</script>

<template>
    <div v-if="data.length === 0" class="py-6 text-center text-gray-400">
        {{ t('player.noMatchData') }}
    </div>

    <div v-else class="mt-2 overflow-x-auto [direction:rtl]">
        <svg
            class="[direction:ltr]"
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

                <circle
                    v-tooltip.top="p.opponent"
                    :cx="p.x"
                    :cy="p.y"
                    r="10"
                    fill="transparent"
                    style="cursor: pointer"
                />
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
