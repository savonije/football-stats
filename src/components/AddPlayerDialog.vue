<script setup lang="ts">
import { ref, reactive } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { TOAST_LIFE } from '@/constants'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { Dialog, InputText, Select, Checkbox, Button } from 'primevue'

const model = defineModel<boolean>('visible')
const playerStore = usePlayerStore()
const toast = useToast()
const { t } = useI18n()

const loading = ref(false)
const form = reactive({
  name: '',
  clothingSize: '' as string | undefined,
  hasJacket: false,
  hasBag: false,
  guestPlayer: false,
})

const resetForm = () => {
  form.name = ''
  form.clothingSize = ''
  form.hasJacket = false
  form.hasBag = false
  form.guestPlayer = false
}

const closeDialog = () => {
  resetForm()
  model.value = false
}

const submit = async () => {
  if (!form.name.trim()) {
    toast.add({
      severity: 'warn',
      summary: t('common.validation.warning'),
      detail: t('common.validation.fillAll'),
      life: TOAST_LIFE,
    })
    return
  }

  loading.value = true
  try {
    const id = crypto.randomUUID()
    await playerStore.addPlayer({
      id,
      name: form.name.trim(),
      clothingSize: form.clothingSize || undefined,
      hasJacket: form.hasJacket,
      hasBag: form.hasBag,
      guestPlayer: form.guestPlayer,
    })
    toast.add({
      severity: 'success',
      summary: t('common.messages.success'),
      detail: t('player.messages.playerAdded'),
      life: TOAST_LIFE,
    })
    closeDialog()
  } catch {
    toast.add({
      severity: 'error',
      summary: t('common.messages.error'),
      life: TOAST_LIFE,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    :header="t('player.addPlayer')"
    :style="{ width: '400px' }"
    :draggable="false"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label for="name">
          {{ $t('common.name') }} <small>({{ $t('common.required') }})</small>
        </label>
        <InputText v-model="form.name" fluid input-id="name" />
      </div>

      <div>
        <label for="clothingSize">
          {{ $t('common.clothingSize') }}
        </label>
        <Select
          v-model="form.clothingSize"
          :options="['164', '158', '152', '146', '140', '134', '128']"
          :placeholder="$t('common.clothingSize')"
          input-id="clothingSize"
          fluid
        />
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="form.hasJacket" binary input-id="hasJacket" />
        <label for="hasJacket">{{ $t('common.hasJacket') }}</label>
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="form.hasBag" binary input-id="hasBag" />
        <label for="hasBag">{{ $t('common.hasBag') }}</label>
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="form.guestPlayer" binary input-id="guestPlayer" />
        <label for="guestPlayer">{{ $t('player.guestPlayer') }}</label>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button :label="$t('common.cancel')" severity="secondary" text @click="closeDialog" />
        <Button :label="$t('common.save')" icon="pi pi-check" :loading="loading" @click="submit" />
      </div>
    </template>
  </Dialog>
</template>
