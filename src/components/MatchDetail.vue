<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useStoreAuth } from '@/stores/authStore'
import { SEASON } from '@/constants'
import { useRoute } from 'vue-router'
import { Button, ToggleButton, InputNumber, Checkbox } from 'primevue'
import dayjs from 'dayjs'
import type { Appearance } from '@/types'

const playerStore = usePlayerStore()
const matchStore = useMatchStore()
const authStore = useStoreAuth()
const seasonId = SEASON
const route = useRoute()
const matchId = computed(() => route.params.id as string)

const editing = ref(false)

const appearancesWithName = computed(() =>
  matchStore.presentPlayers.map((player) => ({
    ...player,
    playerName: playerStore.players[player.playerId] || player.playerId,
  })),
)

onMounted(async () => {
  await matchStore.fetchMatchDetails(seasonId, matchId.value)
  await Promise.all(matchStore.presentPlayers.map((p) => playerStore.fetchPlayerName(p.playerId)))
})

const saveAppearance = async (appearance: Appearance) => {
  await matchStore.updateAppearance(seasonId, matchId.value, appearance.id, {
    goals: appearance.goals,
    isGoalkeeper: appearance.isGoalkeeper,
  })
}
</script>

<template>
  <div class="w-[800px] max-w-full mx-auto p-4">
    <h1
      class="mb-0 flex gap-2 items-center text-primary inline-flex"
      :class="matchStore.selectedMatch?.home ? 'flex-row' : 'flex-row-reverse'"
    >
      <span>SV Apollo '69</span>
      <span> - </span>
      <span>{{ matchStore.selectedMatch?.opponent }}</span>
    </h1>
    <div v-if="matchStore.selectedMatch?.date" class="text-gray-600 text-sm">
      {{ dayjs(matchStore.selectedMatch.date.toDate()).format('D MMMM YYYY') }}
    </div>

    <div
      v-if="matchStore.selectedMatch?.result"
      class="flex items-center justify-center gap-3 my-12"
      :class="matchStore.selectedMatch?.home ? 'flex-row' : 'flex-row-reverse'"
    >
      <div
        class="bg-white flex items-center justify-center text-6xl font-bold size-32 rounded shadow"
      >
        {{ matchStore.selectedMatch.result.goalsFor }}
      </div>
      <div>-</div>
      <div
        class="bg-white flex items-center justify-center text-6xl font-bold size-32 rounded shadow"
      >
        {{ matchStore.selectedMatch.result.goalsAgainst }}
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">{{ $t('common.presentPlayers') }}</h2>
      <div v-if="authStore.user?.id">
        <ToggleButton
          v-model="editing"
          :onLabel="$t('common.view')"
          :offLabel="$t('common.edit')"
          offIcon="pi pi-pencil"
          onIcon="pi pi-eye"
        />
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="appearance in appearancesWithName"
        :key="appearance.id"
        class="flex items-center justify-between bg-white shadow rounded p-4"
      >
        <div class="flex flex-col">
          <router-link
            :to="{ name: 'playerDetail', params: { id: appearance.playerId } }"
            class="font-medium text-primary"
          >
            {{ appearance.playerName }}
          </router-link>
        </div>

        <div v-if="!editing" class="flex items-center gap-4 text-2xl">
          <span v-if="appearance.goals && appearance.goals > 0">
            <span v-for="n in appearance.goals" :key="n">⚽</span>
          </span>
          <span v-else class="text-gray-400">-</span>

          <span v-if="appearance.isGoalkeeper">🧤</span>
        </div>

        <div v-else class="flex items-center gap-4">
          <label class="flex items-center gap-2" for="goalsInput">
            {{ $t('common.goal', 2) }}:
          </label>

          <InputNumber
            id="goalsInput"
            type="number"
            :min="0"
            v-model.number="appearance.goals"
            show-buttons
          />

          <label class="flex items-center gap-2" for="keeperCheckbox">
            {{ $t('common.wasKeeper') }}
          </label>

          <Checkbox id="keeperCheckbox" v-model="appearance.isGoalkeeper" />

          <Button
            :label="$t('common.save')"
            size="small"
            :loading="matchStore.loadingAppearances"
            @click="saveAppearance(appearance)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
