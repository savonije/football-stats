<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { Dialog, DatePicker, InputText, MultiSelect, Select, Button } from 'primevue'
import type { NewMatch } from '@/types'
import { addMatch } from '@/services/matchService'
import { usePlayerStore } from '@/stores/playerStore'
import { SEASON } from '@/constants'

const model = defineModel<boolean>('visible')
const { t } = useI18n()
const toast = useToast()
const seasonId = SEASON
const loading = ref(false)

const form = reactive<NewMatch & { date: Date | null; players?: string[] }>({
  opponent: '',
  date: new Date(),
  home: true,
  players: [],
  result: { goalsFor: 0, goalsAgainst: 0 },
})

const homeOptions = [
  { label: t('common.home'), value: true },
  { label: t('common.away'), value: false },
]

const playerStore = usePlayerStore()

const playerOptions = computed(() =>
  playerStore.players.map((player) => ({
    label: player.name,
    value: player.id,
  })),
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
    await addMatch(seasonId, { ...form, playerIds: form.players })

    toast.add({
      severity: 'success',
      summary: t('common.messages.success'),
      detail: t('match.messages.matchAdded'),
      life: 3000,
    })
    closeDialog()
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: t('common.messages.error'),
      detail: t('match.messages.matchAddError'),
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await playerStore.fetchPlayers()
})
</script>

<template>
  <Dialog
    v-model:visible="model"
    :header="t('match.addMatch')"
    modal
    closable
    dismissableMask
    style="width: 450px"
  >
    <div class="flex flex-col gap-3">
      <div>
        <label>{{ t('common.opponent') }}*</label>
        <InputText v-model="form.opponent" fluid required />
      </div>

      <div>
        <label>{{ t('common.date') }}</label>
        <DatePicker v-model="form.date" dateFormat="dd-mm-yy" showIcon fluid />
      </div>

      <div>
        <label>{{ t('common.homeOrAway') }}</label>
        <Select
          v-model="form.home"
          :options="homeOptions"
          optionLabel="label"
          optionValue="value"
          fluid
        />
      </div>

      <div>
        <label>{{ t('player.player', 2) }}</label>
        <MultiSelect
          v-model="form.players"
          :options="playerOptions"
          optionLabel="label"
          optionValue="value"
          multiple
          showClear
          fluid
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button :label="$t('common.cancel')" @click="closeDialog" severity="secondary" />
        <Button
          :label="$t('common.add')"
          icon="pi pi-check"
          :loading="loading"
          @click="submitMatch"
        />
      </div>
    </template>
  </Dialog>
</template>
