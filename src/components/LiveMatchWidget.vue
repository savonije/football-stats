<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { useI18n } from 'vue-i18n'
import { Card } from 'primevue'
import { RouterLink } from 'vue-router'

const matchStore = useMatchStore()
const { t } = useI18n()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})

onUnmounted(() => clearInterval(timer))

const liveMatch = computed(
  () => matchStore.matches.find((m) => (m.running || m.paused) && !m.ended) ?? null,
)

const currentMinute = computed(() => {
  const match = liveMatch.value
  if (!match?.startTime) return 0

  let elapsed = now.value - match.startTime

  if (match.paused && match.pausedAt) {
    elapsed -= (match.pausedDuration ?? 0) + (now.value - match.pausedAt)
  } else {
    elapsed -= match.pausedDuration ?? 0
  }

  return Math.max(0, Math.floor(elapsed / 60_000))
})
</script>

<template>
  <Card v-if="liveMatch" class="mb-6">
    <template #content>
      <RouterLink
        :to="{ name: 'matchDetail', params: { id: liveMatch.id } }"
        class="block no-underline text-inherit"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="relative flex h-3 w-3">
                <span
                  aria-hidden="true"
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"
                />
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span class="text-red-500 font-semibold text-sm uppercase tracking-wide">
                {{ t('match.live') }}
              </span>
            </div>
            <p class="text-xl font-bold">{{ liveMatch.opponent }}</p>
          </div>

          <div class="text-right">
            <p class="text-4xl font-bold tabular-nums">
              {{ liveMatch.result?.goalsFor ?? 0 }} – {{ liveMatch.result?.goalsAgainst ?? 0 }}
            </p>
            <p class="text-sm text-gray-500 mt-1">{{ currentMinute }}'</p>
          </div>
        </div>
      </RouterLink>
    </template>
  </Card>
</template>
