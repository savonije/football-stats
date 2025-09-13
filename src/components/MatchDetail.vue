<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useStoreAuth } from '@/stores/authStore'
import { SEASON } from '@/constants'
import { useRoute, useRouter } from 'vue-router'
import { ToggleButton, Button, Dialog, ProgressSpinner } from 'primevue'
import { useToast } from 'primevue/usetoast'

import MatchHeader from '@/components/MatchHeader.vue'
import PlayerAppearanceItem from '@/components/PlayerAppearanceItem.vue'
import type { Appearance } from '@/types'
import { useI18n } from 'vue-i18n'

const toast = useToast()
const router = useRouter()
const playerStore = usePlayerStore()
const matchStore = useMatchStore()
const authStore = useStoreAuth()
const seasonId = SEASON
const route = useRoute()
const matchId = computed(() => route.params.id as string)

const { t } = useI18n()
const editing = ref(false)
const showDeleteMatchDialog = ref(false)
const showDeletePlayerDialog = ref(false)
type AppearanceWithName = Appearance & { playerName: string }
const playerToDelete = ref<AppearanceWithName | null>(null)

const appearancesWithName = ref<AppearanceWithName[]>([])

const saveAll = async () => {
  await Promise.all(
    appearancesWithName.value.map((appearance) =>
      matchStore.updateAppearance(seasonId, matchId.value, appearance.id, {
        goals: appearance.goals,
        isGoalkeeper: appearance.isGoalkeeper,
      }),
    ),
  )
  editing.value = false
  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('common.changesSaved'),
    life: 3000,
  })
}

const confirmDeleteMatch = async () => {
  await matchStore.deleteMatch(seasonId, matchId.value)
  showDeleteMatchDialog.value = false
  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('common.deleteMatchSuccess'),
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

onMounted(() => {
  matchStore.fetchMatchDetails(seasonId, matchId.value)
})

watch(
  () => matchStore.presentPlayers,
  async (players) => {
    appearancesWithName.value = players.map((p) => ({ ...p, playerName: p.playerId }))

    await Promise.all(
      appearancesWithName.value.map(async (appearance, index) => {
        const name = await playerStore.fetchPlayerName(appearance.playerId)
        appearancesWithName.value[index].playerName = name
      }),
    )
  },
  { immediate: true },
)
</script>

<template>
  <div class="w-[800px] max-w-full mx-auto sm:p-4" v-if="matchStore.selectedMatch">
    <MatchHeader :match="matchStore.selectedMatch" />

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">{{ t('common.presentPlayers') }}</h2>

      <div class="flex gap-2">
        <template v-if="authStore.user?.id && editing">
          <Button :label="t('common.save')" icon="pi pi-save" @click="saveAll" size="small" />
        </template>

        <template v-if="authStore.user?.id">
          <ToggleButton
            v-model="editing"
            :on-label="t('common.view')"
            :off-label="t('common.edit')"
            off-icon="pi pi-pencil"
            on-icon="pi pi-eye"
          />
        </template>
      </div>
    </div>

    <div class="space-y-4">
      <PlayerAppearanceItem
        v-for="(appearance, index) in appearancesWithName"
        :key="appearance.id"
        v-model:appearance="appearancesWithName[index]"
        :editing="editing"
        :deletePlayer="
          (player) => {
            playerToDelete = player
            showDeletePlayerDialog = true
          }
        "
      />
    </div>

    <div v-if="authStore.user?.id" class="mt-12">
      <Button
        :label="t('common.deleteMatch')"
        severity="danger"
        variant="outlined"
        @click="showDeleteMatchDialog = true"
      />
    </div>

    <Dialog v-model:visible="showDeleteMatchDialog" modal style="width: 350px" :draggable="false">
      <template #header>
        <h3 class="m-0">{{ t('common.deleteMatch') }}</h3>
      </template>
      <p>{{ t('common.deleteMatchConfirm') }}</p>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="t('common.cancel')" @click="showDeleteMatchDialog = false" />
        <Button :label="t('common.delete')" severity="danger" @click="confirmDeleteMatch" />
      </div>
    </Dialog>

    <Dialog v-model:visible="showDeletePlayerDialog" modal style="width: 350px" :draggable="false">
      <template #header>
        <h3 class="m-0">{{ t('common.deletePlayer') }}</h3>
      </template>
      <p>{{ t('common.deletePlayerConfirm', [playerToDelete?.playerName]) }}</p>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="t('common.cancel')" @click="showDeletePlayerDialog = false" />
        <Button :label="t('common.delete')" severity="danger" @click="confirmDeletePlayer" />
      </div>
    </Dialog>
  </div>

  <div v-else-if="!matchStore.appearancesLoaded" class="flex justify-content-center">
    <ProgressSpinner />
  </div>
</template>
