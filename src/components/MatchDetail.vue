<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { useStoreAuth } from '@/stores/authStore'
import { SEASON } from '@/constants'
import { useRoute, useRouter } from 'vue-router'
import { ToggleButton, Button, useConfirm } from 'primevue'
import { useToast } from 'primevue/usetoast'

import MatchHeader from '@/components/MatchHeader.vue'
import PlayerAppearanceItem from '@/components/PlayerAppearanceItem.vue'
import ProgressSpinner from '@/components/ProgressSpinner.vue'
import { useI18n } from 'vue-i18n'

const toast = useToast()
const router = useRouter()
const matchStore = useMatchStore()
const authStore = useStoreAuth()
const seasonId = SEASON
const route = useRoute()
const matchId = computed(() => route.params.id as string)
const confirm = useConfirm()

const { t } = useI18n()
const editing = ref(false)

const appearancesWithName = computed(() => matchStore.presentPlayersWithNames)

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

const confirmMatchEnd = async () => {
  if (!matchStore.selectedMatch?.id) return

  await matchStore.endMatch(seasonId, matchStore.selectedMatch.id)

  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('match.endMatchSuccess'),
    life: 3000,
  })
}

const confirmDeleteMatch = async () => {
  await matchStore.deleteMatch(seasonId, matchId.value)

  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('match.deleteMatchSuccess'),
    life: 3000,
  })

  router.push({ name: 'home' })
}

const durationMinutes = computed(() => matchStore.selectedMatch?.durationMinutes ?? 0)
const isRunning = computed(() => matchStore.selectedMatch?.running)
const isEnded = computed(() => matchStore.selectedMatch?.ended)
const isPaused = computed(() => matchStore.selectedMatch?.paused)

const startMatch = () => {
  if (!matchStore.selectedMatch?.id) return
  matchStore.startMatch(seasonId, matchStore.selectedMatch.id)
}

const pauseMatch = () => {
  if (!matchStore.selectedMatch?.id) return
  matchStore.pauseMatch(seasonId, matchStore.selectedMatch.id)
}

const resumeMatch = () => {
  if (!matchStore.selectedMatch?.id) return
  matchStore.resumeMatch(seasonId, matchStore.selectedMatch.id)
}

onMounted(() => {
  matchStore.fetchMatchDetails(seasonId, matchId.value)
})
</script>

<template>
  <div class="w-[800px] max-w-full mx-auto sm:p-4" v-if="matchStore.selectedMatch">
    <MatchHeader :match="matchStore.selectedMatch" />

    <div
      v-if="!isEnded"
      class="flex flex-col md:flex-row items-center justify-between mt-4 mb-6 p-4 rounded-lg bg-gray-50 shadow"
    >
      <div class="w-full md:w-auto">
        <div class="text-2xl font-bold flex items-center gap-3">
          <span v-if="isRunning" class="block size-3 rounded-full bg-red-500" />
          {{ `${durationMinutes}e minuut` }}
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

      <div v-if="authStore.user?.id" class="flex gap-2 mt-8 md:mt-0">
        <Button
          v-if="!isRunning && !isPaused && !isEnded"
          :label="t('common.start')"
          severity="success"
          @click="startMatch"
        />

        <Button
          v-if="isRunning"
          :label="t('common.pause')"
          severity="warning"
          @click="pauseMatch"
        />

        <Button
          v-if="isPaused"
          :label="t('common.resume')"
          severity="success"
          @click="resumeMatch"
        />

        <Button
          v-if="isRunning || isPaused"
          :label="t('match.endMatch')"
          severity="danger"
          @click="
            confirm.require({
              message: t('match.endMatchConfirm'),
              header: t('match.endMatch'),
              rejectLabel: t('common.cancel'),
              acceptLabel: t('match.endMatch'),
              acceptClass: 'p-button-success',
              accept: confirmMatchEnd,
            })
          "
        />
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold mb-2">{{ t('player.player', 2) }}</h2>

      <div class="flex gap-2">
        <Transition name="fade" mode="out-in">
          <Button
            v-if="authStore.user?.id && editing"
            :label="t('common.save')"
            icon="pi pi-save"
            @click="saveAll"
            size="small"
          />
        </Transition>

        <template v-if="authStore.user?.id && !matchStore.selectedMatch?.ended">
          <ToggleButton
            v-model="editing"
            :on-label="t('common.cancel')"
            :off-label="t('common.edit')"
            off-icon="pi pi-pencil"
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
      />
    </div>

    <div v-if="authStore.user?.id" class="mt-12 flex gap-6 justify-between">
      <Button
        :label="t('match.deleteMatch')"
        severity="danger"
        icon="pi pi-trash"
        variant="outlined"
        @click="
          confirm.require({
            message: t('match.deleteMatchConfirm'),
            header: t('match.deleteMatch'),
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: t('common.cancel'),
            acceptLabel: t('common.delete'),
            acceptClass: 'p-button-danger',
            accept: confirmDeleteMatch,
          })
        "
      />
    </div>
  </div>

  <div v-else-if="!matchStore.appearancesLoaded" class="flex justify-content-center">
    <ProgressSpinner />
  </div>
</template>
