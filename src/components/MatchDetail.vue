<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useStoreAuth } from '@/stores/authStore'
import { SEASON } from '@/constants'
import { useRoute } from 'vue-router'
import { Button, ToggleButton, InputNumber, Checkbox, Dialog } from 'primevue'
import dayjs from 'dayjs'
import type { Appearance } from '@/types'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()

const playerStore = usePlayerStore()
const matchStore = useMatchStore()
const authStore = useStoreAuth()
const seasonId = SEASON
const route = useRoute()
const matchId = computed(() => route.params.id as string)

const editing = ref(false)

// Dialog state
const showDeleteMatchDialog = ref(false)
const showDeletePlayerDialog = ref(false)
const playerToDelete = ref<Appearance | null>(null)

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

const confirmDeleteMatch = async () => {
  try {
    await matchStore.deleteMatch(seasonId, matchId.value)
    showDeleteMatchDialog.value = false

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Wedstrijd succesvol verwijderd!',
      life: 3000,
    })

    router.push({ name: 'home' })
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Er is iets misgegaan bij het verwijderen van de wedstrijd.',
      life: 3000,
    })
  }
}

// Player deletion
const confirmDeletePlayer = async () => {
  if (!playerToDelete.value) return
  await matchStore.deleteAppearance(seasonId, matchId.value, playerToDelete.value.id)
  playerToDelete.value = null
  showDeletePlayerDialog.value = false
}
</script>

<template>
  <div class="w-[800px] max-w-full mx-auto p-4">
    <!-- Match title -->
    <h1
      class="mb-0 flex gap-2 items-center text-primary inline-flex"
      :class="matchStore.selectedMatch?.home ? 'flex-row' : 'flex-row-reverse text-left'"
    >
      <span>SV Apollo '69</span>
      <span> - </span>
      <span>{{ matchStore.selectedMatch?.opponent }}</span>
    </h1>

    <!-- Match date -->
    <div v-if="matchStore.selectedMatch?.date" class="text-gray-600 text-sm">
      {{ dayjs(matchStore.selectedMatch.date.toDate()).format('D MMMM YYYY') }}
    </div>

    <!-- Match score -->
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

    <!-- Players header + edit toggle -->
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

    <!-- Player list -->
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

        <!-- Display mode -->
        <div v-if="!editing" class="flex items-center gap-4 text-2xl">
          <span v-if="appearance.goals && appearance.goals > 0">
            <span v-for="n in appearance.goals" :key="n">⚽</span>
          </span>
          <span v-else class="text-gray-400">-</span>

          <span v-if="appearance.isGoalkeeper">🧤</span>
        </div>

        <!-- Edit mode -->
        <div v-else class="flex items-center gap-4">
          <InputNumber v-model.number="appearance.goals" :min="0" show-buttons />
          <Checkbox v-model="appearance.isGoalkeeper" />

          <Button
            :label="$t('common.save')"
            size="small"
            :loading="matchStore.loadingAppearances"
            @click="saveAppearance(appearance)"
          />

          <Button
            icon="pi pi-trash"
            severity="danger"
            size="small"
            @click="
              () => {
                playerToDelete = appearance
                showDeletePlayerDialog = true
              }
            "
          />
        </div>
      </div>
    </div>

    <!-- Delete match button -->
    <div v-if="authStore.user?.id" class="mt-4">
      <Button
        :label="$t('common.deleteMatch')"
        severity="danger"
        @click="showDeleteMatchDialog = true"
      />
    </div>

    <!-- Delete match confirmation dialog -->
    <Dialog
      v-model:visible="showDeleteMatchDialog"
      modal
      :header="$t('common.deleteMatch')"
      :style="{ width: '350px' }"
    >
      <p>{{ $t('common.deleteMatchConfirm') }}</p>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="$t('common.cancel')" @click="showDeleteMatchDialog = false" />
        <Button :label="$t('common.delete')" severity="danger" @click="confirmDeleteMatch" />
      </div>
    </Dialog>

    <!-- Delete player confirmation dialog -->
    <Dialog
      v-model:visible="showDeletePlayerDialog"
      modal
      :header="$t('common.deletePlayer')"
      :style="{ width: '350px' }"
    >
      <p>{{ $t('common.deletePlayerConfirm', { player: playerToDelete?.playerName }) }}</p>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="$t('common.cancel')" @click="showDeletePlayerDialog = false" />
        <Button :label="$t('common.delete')" severity="danger" @click="confirmDeletePlayer" />
      </div>
    </Dialog>
  </div>
</template>
