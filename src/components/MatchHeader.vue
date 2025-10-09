<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { Match } from '@/types'
import ScoreBox from '@/components/ScoreBox.vue'
import { TEAMNAME } from '@/constants'

const props = defineProps<{ match: Match | null }>()
const homeClass = computed(() => (props.match?.home ? 'flex-row' : 'flex-row-reverse'))
</script>

<template>
  <div v-if="props.match">
    <h1
      class="mb-0 flex gap-2 items-center text-primary inline-flex text-xl sm:text-3xl"
      :class="homeClass"
    >
      <span>{{ TEAMNAME }}</span>
      <span> - </span>
      <span>{{ props.match?.opponent }}</span>
    </h1>

    <div v-if="props.match?.date" class="text-gray-600 text-sm">
      {{ dayjs(props.match.date.toDate()).format('D MMMM YYYY') }}
    </div>

    <div class="flex items-center justify-center gap-3 my-12" :class="homeClass">
      <ScoreBox :match="props.match" type="for" :reversed="props.match?.home" />

      <div class="text-2xl font-bold">-</div>

      <ScoreBox :match="props.match" type="against" :reversed="!props.match?.home" />
    </div>
  </div>
</template>
