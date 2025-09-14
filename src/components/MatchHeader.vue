<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { Match } from '@/types'

const props = defineProps<{ match: Match | null }>()

const homeClass = computed(() => (props.match?.home ? 'flex-row' : 'flex-row-reverse text-left'))
</script>

<template>
  <div v-if="props.match">
    <h1
      class="mb-0 flex gap-2 items-center text-primary inline-flex text-xl sm:text-3xl"
      :class="homeClass"
    >
      <span>SV Apollo '69</span>
      <span> - </span>
      <span>{{ props.match?.opponent }}</span>
    </h1>

    <div v-if="props.match?.date" class="text-gray-600 text-sm">
      {{ dayjs(props.match.date.toDate()).format('D MMMM YYYY') }}
    </div>

    <div
      class="flex items-center justify-center gap-3 my-12"
      :class="props.match?.home ? 'flex-row' : 'flex-row-reverse'"
    >
      <div class="score-box">
        <template v-if="props.match?.result?.goalsFor">
          {{ props.match.result.goalsFor }}
        </template>
      </div>
      <div class="text-2xl font-bold">-</div>
      <div class="score-box">
        <template v-if="props.match?.result?.goalsAgainst">
          {{ props.match.result.goalsAgainst }}
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference '@/styles/main.css';

.score-box {
  @apply bg-white flex items-center justify-center text-4xl sm:text-6xl font-bold size-24 sm:size-32 rounded shadow;
}
</style>
