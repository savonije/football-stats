<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { Match } from '@/types'
import { useStoreAuth } from '@/stores/authStore'
import { Button, useToast } from 'primevue'
import { useMatchStore } from '@/stores/matchStore'
import { SEASON } from '@/constants'
import { useI18n } from 'vue-i18n'

const matchStore = useMatchStore()

const props = defineProps<{ match: Match | null }>()

const authStore = useStoreAuth()
const seasonId = SEASON
const toast = useToast()
const { t } = useI18n()

const homeClass = computed(() => (props.match?.home ? 'flex-row' : 'flex-row-reverse text-left'))

const updateGoals = async (type: 'for' | 'against', delta: 1 | -1) => {
  if (!props.match?.id) return

  const matchId = props.match.id
  const currentGoals =
    type === 'for' ? (props.match.result?.goalsFor ?? 0) : (props.match.result?.goalsAgainst ?? 0)

  const newGoals = currentGoals + delta

  await matchStore.updateMatchGoals(seasonId, matchId, type, newGoals)

  if (delta > 0) {
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t(`common.goalTypes.${type}`),
      life: 3000,
    })
  }
}
</script>

<template>
  <div v-if="props.match">
    <h1
      class="mb-0 flex gap-2 items-center text-primary inline-flex text-xl sm:text-3xl"
      :class="homeClass"
    >
      <span>SV Apollo '69</span>
      <span> - </span>
      <span>{{ props.match?.opponent }}</span>
    </h1>

    <div v-if="props.match?.date" class="text-gray-600 text-sm">
      {{ dayjs(props.match.date.toDate()).format('D MMMM YYYY') }}
    </div>

    <div
      class="flex items-center justify-center gap-3 my-12"
      :class="props.match?.home ? 'flex-row' : 'flex-row-reverse'"
    >
      <div class="flex" :class="props.match?.home ? 'flex-row' : 'flex-row-reverse'">
        <div v-if="authStore.user?.id" class="flex justify-between gap-3 flex-col mx-6">
          <Button
            icon="pi pi-chevron-up"
            severity="secondary"
            text
            @click="updateGoals('for', 1)"
          />

          <Button
            icon="pi pi-chevron-down"
            severity="secondary"
            text
            @click="updateGoals('for', -1)"
          />
        </div>

        <div class="score-box">
          <template v-if="props.match?.result?.goalsFor">
            {{ props.match.result.goalsFor }}
          </template>
        </div>
      </div>

      <div class="text-2xl font-bold">-</div>

      <div class="flex" :class="props.match?.home ? 'flex-row' : 'flex-row-reverse'">
        <div class="score-box">
          <template v-if="props.match?.result?.goalsAgainst">
            {{ props.match.result.goalsAgainst }}
          </template>
        </div>

        <div v-if="authStore.user?.id" class="flex justify-between gap-3 flex-col mx-6">
          <Button
            icon="pi pi-chevron-up"
            severity="secondary"
            text
            @click="updateGoals('against', 1)"
          />

          <Button
            icon="pi pi-chevron-down"
            severity="secondary"
            text
            @click="updateGoals('against', -1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference '@/styles/main.css';

.score-box {
  @apply bg-white flex items-center justify-center text-4xl sm:text-6xl font-bold size-24 sm:size-32 rounded shadow;
}
</style>
