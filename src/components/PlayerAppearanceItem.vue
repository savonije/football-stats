<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button, InputNumber, Checkbox } from 'primevue'
import type { Appearance } from '@/types'

type AppearanceWithName = Appearance & { playerName: string }

const props = defineProps<{
  appearance: AppearanceWithName
  editing: boolean
  save: (appearance: AppearanceWithName) => void
  deletePlayer: (appearance: AppearanceWithName) => void
}>()

const localAppearance = ref<AppearanceWithName>({ ...props.appearance })

watch(
  () => props.appearance,
  (newVal) => {
    localAppearance.value = { ...newVal }
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div class="flex items-center justify-between bg-white shadow rounded p-4">
    <div class="flex flex-col">
      <router-link
        :to="{ name: 'playerDetail', params: { id: props.appearance.playerId } }"
        class="font-medium text-primary"
      >
        {{ props.appearance.playerName }}
      </router-link>
    </div>

    <div v-if="!props.editing" class="flex items-center gap-4 text-2xl">
      <span v-if="props.appearance.goals && props.appearance.goals > 0">
        <span v-for="n in props.appearance.goals" :key="n">⚽</span>
      </span>
      <span v-else class="text-gray-400">-</span>
      <span v-if="props.appearance.isGoalkeeper">🧤</span>
    </div>

    <div v-else class="flex items-center gap-4">
      <label>{{ $t('common.goal', 2) }}</label>
      <InputNumber v-model.number="localAppearance.goals" :min="0" show-buttons />

      <label>{{ $t('common.wasKeeper') }}</label>
      <Checkbox
        v-model="localAppearance.isGoalkeeper"
        :value="localAppearance.isGoalkeeper"
        name="wasKeeper"
        binary
      />

      <Button :label="$t('common.save')" size="small" @click="props.save(localAppearance)" />
      <Button
        icon="pi pi-trash"
        severity="danger"
        size="small"
        @click="props.deletePlayer(localAppearance)"
      />
    </div>
  </div>
</template>
