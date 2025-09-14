<script lang="ts" setup>
import { ProgressSpinner } from 'primevue'
</script>

<template>
  <ProgressSpinner
    style="width: 50px; height: 50px"
    strokeWidth="4"
    fill="transparent"
    animationDuration=".5s"
    :aria-label="$t('common.loadingData')"
  />
</template>
>
