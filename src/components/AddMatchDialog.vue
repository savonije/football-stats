<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { Dialog, DatePicker, InputText, MultiSelect, Select, InputNumber, Button } from 'primevue'
import type { NewMatch, Player } from '@/types'
import { addMatch } from '@/services/matchService'
import { usePlayerStore } from '@/stores/playerStore'

const model = defineModel<boolean>('visible')
const { t } = useI18n()
const toast = useToast()
const seasonId = '2025-2026'
const loading = ref(false)

const form = reactive<NewMatch & { date: Date | null; players?: string[] }>({
  opponent: '',
  date: new Date(),
  home: true,
  players: [],
})
const goalsFor = ref<number | null>(null)
const goalsAgainst = ref<number | null>(null)

const homeOptions = [
  { label: t('common.home'), value: true },
  { label: t('common.away'), value: false },
]

const playerStore = usePlayerStore()
const availablePlayers = ref<Player[]>([])

onMounted(async () => {
  await playerStore.fetchPlayers()
  availablePlayers.value = Object.entries(playerStore.players).map(([id, name]) => ({ id, name }))
})

const playerOptions = computed(() =>
  availablePlayers.value.map((player) => ({ label: player.name, value: player.id })),
)

const closeDialog = () => (model.value = false)

const submitMatch = async () => {
  if (!form.opponent || !form.date) {
    toast.add({
      severity: 'warn',
      summary: t('common.validation.warning'),
      detail: t('common.validation.fillAll'),
      life: 3000,
    })
    return
  }

  loading.value = true
  try {
    if (goalsFor.value !== null && goalsAgainst.value !== null) {
      form.result = { goalsFor: goalsFor.value, goalsAgainst: goalsAgainst.value }
    }

    await addMatch(seasonId, { ...form, playerIds: form.players })

    toast.add({
      severity: 'success',
      summary: t('common.messages.success'),
      detail: t('common.messages.matchAdded'),
      life: 3000,
    })
    closeDialog()
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: t('common.messages.error'),
      detail: t('common.messages.matchAddError'),
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="model"
    :header="t('common.addMatch')"
    modal
    closable
    dismissableMask
    style="width: 450px"
  >
    <div class="flex flex-col gap-3">
      <label>{{ t('common.opponent') }}</label>
      <InputText v-model="form.opponent" />

      <label>{{ t('common.date') }}</label>
      <DatePicker v-model="form.date" dateFormat="yy-mm-dd" showIcon />

      <label>{{ t('common.homeOrAway') }}</label>
      <Select v-model="form.home" :options="homeOptions" optionLabel="label" optionValue="value" />

      <label>{{ t('common.player', 2) }}</label>
      <MultiSelect
        v-model="form.players"
        :options="playerOptions"
        optionLabel="label"
        optionValue="value"
        multiple
        showClear
      />

      <label>{{ t('common.goalsFor') }}</label>
      <InputNumber v-model="goalsFor" :showButtons="true" />

      <label>{{ t('common.goalsAgainst') }}</label>
      <InputNumber v-model="goalsAgainst" :showButtons="true" />
    </div>

    <template #footer>
      <Button label="Annuleren" icon="pi pi-times" @click="closeDialog" />
      <Button label="Toevoegen" icon="pi pi-check" :loading="loading" @click="submitMatch" />
    </template>
  </Dialog>
</template>
