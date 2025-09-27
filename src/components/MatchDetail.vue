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
    detail: t('common.endMatchSuccess'),
    life: 3000,
  })
}

const confirmDeleteMatch = async () => {
  await matchStore.deleteMatch(seasonId, matchId.value)

  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('common.deleteMatchSuccess'),
    life: 3000,
  })

  router.push({ name: 'home' })
}

onMounted(() => {
  matchStore.fetchMatchDetails(seasonId, matchId.value)
})
</script>

<template>
  <div class="w-[800px] max-w-full mx-auto sm:p-4" v-if="matchStore.selectedMatch">
    <MatchHeader :match="matchStore.selectedMatch" />

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold mb-2">{{ t('common.player', 2) }}</h2>

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
      />
    </div>

    <div v-if="authStore.user?.id" class="mt-12 flex gap-6 justify-between">
      <Button
        :label="t('common.deleteMatch')"
        severity="danger"
        icon="pi pi-trash"
        variant="outlined"
        @click="
          confirm.require({
            message: t('common.deleteMatchConfirm'),
            header: t('common.deleteMatch'),
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: t('common.cancel'),
            acceptLabel: t('common.delete'),
            acceptClass: 'p-button-danger',
            accept: confirmDeleteMatch,
          })
        "
      />

      <Button
        v-if="!matchStore.selectedMatch.ended"
        label="Wedstrijd vastleggen"
        variant="outlined"
        severity="success"
        icon="pi pi-check"
        @click="
          confirm.require({
            message: t('common.endMatchConfirm'),
            header: t('common.endMatch'),
            rejectLabel: t('common.cancel'),
            acceptLabel: t('common.endMatch'),
            acceptClass: 'p-button-success',
            accept: confirmMatchEnd,
          })
        "
      />
    </div>
  </div>

  <div v-else-if="!matchStore.appearancesLoaded" class="flex justify-content-center">
    <ProgressSpinner />
  </div>
</template>
