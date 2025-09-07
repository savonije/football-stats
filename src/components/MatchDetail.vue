<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useStoreAuth } from '@/stores/authStore'
import { SEASON } from '@/constants'
import { useRoute, useRouter } from 'vue-router'
import { ToggleButton, Button, Dialog } from 'primevue'
import { useToast } from 'primevue/usetoast'

import MatchHeader from '@/components/MatchHeader.vue'
import PlayerAppearanceItem from '@/components/PlayerAppearanceItem.vue'
import type { Appearance } from '@/types'

const toast = useToast()
const router = useRouter()

const playerStore = usePlayerStore()
const matchStore = useMatchStore()
const authStore = useStoreAuth()
const seasonId = SEASON
const route = useRoute()
const matchId = computed(() => route.params.id as string)

const editing = ref(false)
const showDeleteMatchDialog = ref(false)
const showDeletePlayerDialog = ref(false)
type AppearanceWithName = Appearance & { playerName: string }

const playerToDelete = ref<AppearanceWithName | null>(null)

const appearancesWithName = computed<AppearanceWithName[]>(() =>
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
  await matchStore.deleteMatch(seasonId, matchId.value)
  showDeleteMatchDialog.value = false
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Wedstrijd verwijderd!',
    life: 3000,
  })
  router.push({ name: 'home' })
}

const confirmDeletePlayer = async () => {
  if (!playerToDelete.value) return
  await matchStore.deleteAppearance(seasonId, matchId.value, playerToDelete.value.id)
  playerToDelete.value = null
  showDeletePlayerDialog.value = false
}
</script>

<template>
  <div class="w-[800px] max-w-full mx-auto p-4">
    <MatchHeader :match="matchStore.selectedMatch" />

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
      <PlayerAppearanceItem
        v-for="appearance in appearancesWithName"
        :key="appearance.id"
        :appearance="appearance"
        :editing="editing"
        :save="saveAppearance"
        :deletePlayer="
          (player) => {
            playerToDelete = player
            showDeletePlayerDialog = true
          }
        "
      />
    </div>

    <div v-if="authStore.user?.id" class="mt-12 flex justify-end">
      <Button
        :label="$t('common.deleteMatch')"
        severity="danger"
        @click="showDeleteMatchDialog = true"
      />
    </div>

    <Dialog v-model:visible="showDeleteMatchDialog" modal header="Confirm" style="width: 350px">
      <template #header>
        <h3 class="m-0">{{ $t('common.deleteMatch') }}</h3>
      </template>
      <p>{{ $t('common.deleteMatchConfirm') }}</p>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="$t('common.cancel')" @click="showDeleteMatchDialog = false" />
        <Button :label="$t('common.delete')" severity="danger" @click="confirmDeleteMatch" />
      </div>
    </Dialog>

    <Dialog v-model:visible="showDeletePlayerDialog" modal header="Confirm" style="width: 350px">
      <template #header>
        <h3 class="m-0">{{ $t('common.deletePlayer') }}</h3>
      </template>
      <p>
        {{ $t('common.deletePlayerConfirm', [playerToDelete?.playerName]) }}
      </p>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="$t('common.cancel')" @click="showDeletePlayerDialog = false" />
        <Button :label="$t('common.delete')" severity="danger" @click="confirmDeletePlayer" />
      </div>
    </Dialog>
  </div>
</template>
