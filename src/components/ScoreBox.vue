<script setup lang="ts">
import { Button, useToast } from 'primevue'
import type { Match } from '@/types'
import { useStoreAuth } from '@/stores/authStore'
import { useMatchStore } from '@/stores/matchStore'
import { SEASON } from '@/constants'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  match: Match
  type: 'for' | 'against'
  reversed?: boolean
}>()

const authStore = useStoreAuth()
const matchStore = useMatchStore()
const toast = useToast()
const { t } = useI18n()

const seasonId = SEASON

const updateGoals = async (delta: 1 | -1) => {
  if (!props.match?.id) return

  const matchId = props.match.id
  const currentGoals =
    props.type === 'for'
      ? (props.match.result?.goalsFor ?? 0)
      : (props.match.result?.goalsAgainst ?? 0)

  const newGoals = currentGoals + delta

  if (newGoals < 0) return

  await matchStore.updateMatchGoals(seasonId, matchId, props.type, newGoals)

  if (delta > 0) {
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t(`common.goalTypes.${props.type}`),
      life: 3000,
    })
  }
}
</script>

<template>
  <div class="flex" :class="reversed ? 'flex-row' : 'flex-row-reverse'">
    <div v-if="authStore.user?.id && !match.ended" class="flex justify-between gap-3 flex-col mx-6">
      <Button icon="pi pi-chevron-up" severity="secondary" text @click="updateGoals(1)" />

      <Button icon="pi pi-chevron-down" severity="secondary" text @click="updateGoals(-1)" />
    </div>

    <div class="score-box">
      <template v-if="type === 'for'">
        {{ match?.result?.goalsFor }}
      </template>
      <template v-else>
        {{ match?.result?.goalsAgainst }}
      </template>
    </div>
  </div>
</template>

<style scoped>
@reference '@/styles/main.css';

.score-box {
  @apply bg-white flex items-center justify-center text-4xl sm:text-6xl font-bold size-24 sm:size-32 rounded shadow;
}
</style>
