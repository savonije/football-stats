<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { Match } from '@/types'

const props = defineProps<{ match: Match | null }>()

const homeClass = computed(() => (props.match?.home ? 'flex-row' : 'flex-row-reverse text-left'))
</script>

<template>
  <div v-if="props.match">
    <h1 class="mb-0 flex gap-2 items-center text-primary inline-flex" :class="homeClass">
      <span>SV Apollo '69</span>
      <span> - </span>
      <span>{{ props.match?.opponent }}</span>
    </h1>

    <div v-if="props.match?.date" class="text-gray-600 text-sm">
      {{ dayjs(props.match.date.toDate()).format('D MMMM YYYY') }}
    </div>

    <div
      v-if="props.match?.result"
      class="flex items-center justify-center gap-3 my-12"
      :class="props.match?.home ? 'flex-row' : 'flex-row-reverse'"
    >
      <div
        class="bg-white flex items-center justify-center text-6xl font-bold size-32 rounded shadow"
      >
        {{ props.match.result.goalsFor }}
      </div>
      <div class="text-2xl font-bold">-</div>
      <div
        class="bg-white flex items-center justify-center text-6xl font-bold size-32 rounded shadow"
      >
        {{ props.match.result.goalsAgainst }}
      </div>
    </div>
  </div>
</template>
