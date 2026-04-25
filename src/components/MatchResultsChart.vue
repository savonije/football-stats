<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Tooltip from 'primevue/tooltip'

interface MatchBar {
  opponent: string
  goalsFor: number
  goalsAgainst: number
}

const props = defineProps<{
  data: MatchBar[]
}>()

const { t } = useI18n()

const vTooltip = Tooltip

const barWidth = computed(() => (containerWidth.value < 640 ? 30 : 60))
const MAX_BAR_H = 75
const DRAW_H = 6
const PAD_T = 30
const PAD_L = 30
const PAD_R = 30
const CENTER_Y = PAD_T + MAX_BAR_H // 105
const H = 210

const containerRef = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!containerRef.value) return
  containerWidth.value = containerRef.value.clientWidth
  resizeObserver = new ResizeObserver(([entry]) => {
    containerWidth.value = entry.contentRect.width
  })
  resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

const colWidth = computed(() =>
  props.data.length > 0 ? (containerWidth.value - PAD_L - PAD_R) / props.data.length : 0,
)

const maxGoalDiff = computed(() =>
  Math.max(...props.data.map((d) => Math.abs(d.goalsFor - d.goalsAgainst)), 1),
)

const bars = computed(() =>
  props.data.map((d, i) => {
    const cx = PAD_L + (i + 0.5) * colWidth.value
    const diff = d.goalsFor - d.goalsAgainst
    const absDiff = Math.abs(diff)
    const isWin = diff > 0
    const isDraw = diff === 0

    let barH: number
    let barY: number
    let color: string
    let labelY: number
    let labelColor: string

    if (isDraw) {
      barH = DRAW_H
      barY = CENTER_Y - DRAW_H
      color = '#9ca3af'
      labelY = barY - 7
      labelColor = '#6b7280'
    } else if (isWin) {
      barH = (absDiff / maxGoalDiff.value) * MAX_BAR_H
      barY = CENTER_Y - barH
      color = '#16a34a'
      labelY = barY - 7
      labelColor = '#15803d'
    } else {
      barH = (absDiff / maxGoalDiff.value) * MAX_BAR_H
      barY = CENTER_Y
      color = '#dc2626'
      labelY = barY + barH + 13
      labelColor = '#b91c1c'
    }

    return {
      barX: cx - barWidth.value / 2,
      barY,
      barH,
      barW: barWidth.value,
      color,
      labelY,
      labelColor,
      score: `${d.goalsFor}-${d.goalsAgainst}`,
      opponent: d.opponent,
      cx,
    }
  }),
)
</script>

<template>
  <div v-if="data.length === 0" class="text-center text-gray-400 py-4">
    {{ t('match.noMatches') }}
  </div>

  <div v-else ref="containerRef" class="mt-2 w-full">
    <svg
      v-if="containerWidth > 0"
      width="100%"
      :height="H"
      :viewBox="`0 0 ${containerWidth} ${H}`"
      role="img"
    >
      <line
        :x1="PAD_L - 8"
        :y1="CENTER_Y"
        :x2="containerWidth - PAD_R + 8"
        :y2="CENTER_Y"
        stroke="#d1d5db"
        stroke-width="1.5"
      />

      <g v-for="(bar, i) in bars" :key="i">
        <rect
          v-tooltip="bar.opponent"
          :x="bar.barX"
          :y="bar.barY"
          :width="bar.barW"
          :height="bar.barH"
          :fill="bar.color"
          opacity="0.85"
          style="cursor: pointer"
        />

        <text
          :x="bar.cx"
          :y="bar.labelY"
          text-anchor="middle"
          font-size="11"
          font-weight="600"
          :fill="bar.labelColor"
        >
          {{ bar.score }}
        </text>
      </g>
    </svg>
  </div>
</template>
