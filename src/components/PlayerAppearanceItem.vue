<script setup lang="ts">
import { InputNumber, Checkbox, Button, Skeleton, useConfirm } from 'primevue'
import type { Appearance } from '@/types'
import { useI18n } from 'vue-i18n'
import { useMatchStore } from '@/stores/matchStore'
import { SEASON } from '@/constants'
import { useRoute } from 'vue-router'

type AppearanceWithName = Appearance & { playerName: string }

const props = defineProps<{
  editing: boolean
}>()

const { t } = useI18n()
const confirm = useConfirm()
const matchStore = useMatchStore()
const seasonId = SEASON
const route = useRoute()
const matchId = route.params.id as string

const appearance = defineModel<AppearanceWithName>('appearance')

const handleDelete = () => {
  if (!appearance.value) return

  confirm.require({
    message: t('common.deletePlayerConfirm', [appearance.value.playerName]),
    header: t('common.deletePlayer'),
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: t('common.cancel'),
    acceptLabel: t('common.delete'),
    acceptClass: 'p-button-danger',
    accept: async () => {
      await matchStore.deleteAppearance(seasonId, matchId, appearance.value!.id)
    },
  })
}
</script>

<template>
  <div
    v-if="appearance && appearance.playerName"
    :class="{
      'flex md:items-center justify-between bg-white shadow rounded p-4 min-h-[70px]': true,
      'flex-col md:flex-row gap-2': editing,
    }"
  >
    <div class="flex flex-col">
      <router-link
        :to="{ name: 'playerDetail', params: { id: appearance.playerId } }"
        class="font-medium text-primary"
      >
        {{ appearance.playerName }}
      </router-link>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="!props.editing" class="flex items-center gap-4 text-2xl">
        <span v-if="appearance.goals && appearance.goals > 0">
          <span v-for="n in appearance.goals" :key="n">⚽</span>
        </span>
        <span v-if="appearance.isGoalkeeper">🧤</span>
      </div>

      <div v-else class="flex flex-col md:flex-row md:items-center gap-6">
        <div class="flex gap-3 items-center">
          <label for="goals">{{ $t('common.goal', 2) }}</label>
          <InputNumber
            input-id="goals"
            v-model.number="appearance.goals"
            :min="0"
            show-buttons
            size="small"
          />
        </div>

        <div class="flex gap-3 items-center">
          <label for="isGoalkeeper">{{ $t('common.wasKeeper') }}</label>
          <Checkbox
            v-model="appearance.isGoalkeeper"
            name="isGoalkeeper"
            input-id="isGoalkeeper"
            binary
          />
        </div>

        <Button
          icon="pi pi-trash"
          severity="danger"
          :aria-label="$t('common.deletePlayer')"
          size="small"
          @click="handleDelete"
        />
      </div>
    </Transition>
  </div>
  <div v-else>
    <Skeleton width="100%" height="4rem" />
  </div>
</template>
