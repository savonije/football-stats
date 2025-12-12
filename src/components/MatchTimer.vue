<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { Button, useConfirm } from 'primevue'

interface Props {
  seasonId: string
}

const props = defineProps<Props>()
const matchStore = useMatchStore()
const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

const now = ref(Date.now())

let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000) // update every second
})

onUnmounted(() => {
  clearInterval(timer)
})

const duration = computed(() => {
  const match = matchStore.selectedMatch
  if (!match?.startTime) return '0:00'

  let elapsed = now.value - match.startTime

  if (match.paused && match.pausedAt) {
    elapsed -= (match.pausedDuration ?? 0) + (now.value - match.pausedAt)
  } else {
    elapsed -= match.pausedDuration ?? 0
  }

  const totalSeconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const isRunning = computed(() => matchStore.selectedMatch?.running)
const isPaused = computed(() => matchStore.selectedMatch?.paused)
const isEnded = computed(() => matchStore.selectedMatch?.ended)

const startMatch = () => {
  if (!matchStore.selectedMatch?.id) return
  matchStore.startMatch(props.seasonId, matchStore.selectedMatch.id)
}

const pauseMatch = () => {
  if (!matchStore.selectedMatch?.id) return
  matchStore.pauseMatch(props.seasonId, matchStore.selectedMatch.id)
}

const resumeMatch = () => {
  if (!matchStore.selectedMatch?.id) return
  matchStore.resumeMatch(props.seasonId, matchStore.selectedMatch.id)
}

const endMatch = async () => {
  if (!matchStore.selectedMatch?.id) return

  confirm.require({
    message: t('match.endMatchConfirm'),
    header: t('match.endMatch'),
    rejectLabel: t('common.cancel'),
    acceptLabel: t('match.endMatch'),
    acceptClass: 'p-button-success',
    accept: async () => {
      await matchStore.endMatch(props.seasonId, matchStore.selectedMatch!.id)
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('match.endMatchSuccess'),
        life: 3000,
      })
    },
  })
}
</script>

<template>
  <div
    v-if="matchStore.selectedMatch"
    class="flex flex-col md:flex-row items-center justify-between mt-4 mb-6 p-4 rounded-lg bg-gray-50 shadow"
  >
    <div class="w-full md:w-auto">
      <div v-if="!isEnded" class="text-2xl font-bold flex items-center gap-3">
        <span v-if="isRunning" class="block w-3 h-3 rounded-full bg-red-500" />
        {{ duration }}
      </div>

      <div v-if="isRunning" class="text-green-600 font-semibold mt-1">
        {{ t('match.running') }}
      </div>
      <div v-else-if="isPaused" class="text-gray-500 font-semibold mt-1">
        {{ t('match.isPaused') }}
      </div>
      <div v-else-if="isEnded" class="text-gray-500 font-semibold mt-1">
        {{ t('match.isEnded') }}
      </div>
    </div>

    <div class="flex gap-2 mt-4 md:mt-0">
      <Button
        v-if="!isRunning && !isPaused && !isEnded"
        :label="t('common.start')"
        severity="success"
        @click="startMatch"
      />
      <Button v-if="isRunning" :label="t('common.pause')" severity="warning" @click="pauseMatch" />
      <Button v-if="isPaused" :label="t('common.resume')" severity="success" @click="resumeMatch" />
      <Button
        v-if="isRunning || isPaused"
        :label="t('match.endMatch')"
        severity="danger"
        @click="endMatch"
      />
    </div>
  </div>
</template>
