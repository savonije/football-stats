<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useStoreAuth } from '@/stores/authStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { TOAST_LIFE } from '@/constants'
import { useToast } from 'primevue/usetoast'

import { Skeleton, Card, Dialog, InputText, Checkbox, Select, Button } from 'primevue'
import type { Player } from '@/types'
import { useI18n } from 'vue-i18n'
import PlayerGoalsChart from '@/components/PlayerGoalsChart.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'

const matchStore = useMatchStore()
const playerStore = usePlayerStore()
const AuthStore = useStoreAuth()
const seasonStore = useSeasonStore()
const route = useRoute()
const toast = useToast()
const { t } = useI18n()

const playerId = computed(() => route.params.id as string)
const player = ref<Player | null>(null)
const loading = ref(true)
const editVisible = ref(false)
const editForm = ref<Partial<Player>>({})

const playerAppearances = computed(() =>
  matchStore.appearances.filter((a) => a.playerId === playerId.value),
)
const totalGoals = computed(() =>
  playerAppearances.value.reduce((sum, a) => sum + (a.goals || 0), 0),
)
const totalAppearances = computed(() => playerAppearances.value.filter((a) => a.present).length)
const totalKeeper = computed(() => playerAppearances.value.filter((a) => a.isGoalkeeper).length)
const totalMatches = computed(() => matchStore.matches.length)
const goalsPerMatch = computed(() =>
  totalAppearances.value > 0 ? (totalGoals.value / totalAppearances.value).toFixed(2) : '0.00',
)
const attendancePercentage = computed(() =>
  totalMatches.value > 0 ? Math.round((totalAppearances.value / totalMatches.value) * 100) : 0,
)

const animatedBarWidth = ref(0)
watch(
  [loading, attendancePercentage],
  ([isLoading, pct]) => {
    if (!isLoading) {
      setTimeout(() => {
        animatedBarWidth.value = pct as number
      }, 80)
    } else {
      animatedBarWidth.value = 0
    }
  },
  { immediate: true },
)

const goalsChartData = computed(() =>
  matchStore.appearances
    .filter((a) => a.playerId === playerId.value && a.present)
    .map((a) => {
      const match = matchStore.matches.find((m) => m.id === a.matchId)
      if (!match) return null
      return {
        goals: a.goals || 0,
        opponent: match.opponent,
        dateSeconds: match.date?.seconds ?? 0,
      }
    })
    .filter(
      (item): item is { goals: number; opponent: string; dateSeconds: number } => item !== null,
    )
    .sort((a, b) => a.dateSeconds - b.dateSeconds)
    .map(({ goals, opponent }) => ({ goals, opponent })),
)

const openEditDialog = () => {
  if (player.value) {
    editForm.value = { ...player.value }
    editVisible.value = true
  }
}

const savePlayer = async () => {
  if (!player.value) return
  await playerStore.updatePlayer(player.value.id, editForm.value)
  player.value = { ...player.value, ...editForm.value } as Player
  editVisible.value = false
  toast.add({
    severity: 'success',
    summary: t('common.messages.success'),
    detail: t('player.messages.playerEditted'),
    life: TOAST_LIFE,
  })
}

onMounted(async () => {
  const p = await playerStore.fetchPlayer(playerId.value)
  player.value = p ?? null
  matchStore.fetchMatches(seasonStore.currentSeason)
  matchStore.fetchAppearances(seasonStore.currentSeason)
  loading.value = false
})

watch(
  () => seasonStore.currentSeason,
  (seasonId) => {
    matchStore.fetchMatches(seasonId)
    matchStore.fetchAppearances(seasonId)
  },
)
</script>

<template>
  <AppBreadcrumb :label="player?.name" />

  <!-- Hero banner -->
  <div class="player-hero mb-6">
    <div class="hero-texture" />
    <div class="hero-body">
      <div class="hero-avatar">
        <span v-if="player">{{ player.name.charAt(0).toUpperCase() }}</span>
        <i v-else class="pi pi-user" />
      </div>

      <div class="min-w-0 flex-1">
        <Skeleton v-if="loading || !player" height="36px" width="180px" class="mb-2" />
        <h1 v-else class="text-3xl lg:text-4xl font-black text-white mb-0 truncate">
          {{ player.name }}
        </h1>
        <span v-if="!loading && player?.guestPlayer" class="hero-badge">
          {{ $t('player.guestPlayer') }}
        </span>
      </div>

      <button v-if="player && AuthStore.user?.id" class="hero-edit-btn" @click="openEditDialog">
        <i class="pi pi-pencil" />
        {{ $t('common.edit') }}
      </button>
    </div>
  </div>

  <!-- Stat tiles -->
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
    <div class="stat-tile" style="--accent: linear-gradient(135deg, #f59e0b, #b45309)">
      <div class="stat-icon"><i class="pi pi-trophy" /></div>
      <Skeleton v-if="loading" height="44px" width="56px" class="my-1" />
      <div v-else class="stat-value">{{ totalGoals }}</div>
      <div class="stat-label">{{ $t('player.totalGoals') }}</div>
    </div>

    <div class="stat-tile" style="--accent: linear-gradient(135deg, #3b82f6, #1d4ed8)">
      <div class="stat-icon"><i class="pi pi-calendar" /></div>
      <Skeleton v-if="loading" height="44px" width="80px" class="my-1" />
      <div v-else class="stat-value">
        {{ totalAppearances }}<span class="stat-sub">/{{ totalMatches }}</span>
      </div>
      <div class="stat-label">{{ $t('player.totalAppearances') }}</div>
    </div>

    <div class="stat-tile" style="--accent: linear-gradient(135deg, #14b8a6, #0f766e)">
      <div class="stat-icon"><i class="pi pi-shield" /></div>
      <Skeleton v-if="loading" height="44px" width="56px" class="my-1" />
      <div v-else class="stat-value">{{ totalKeeper }}</div>
      <div class="stat-label">{{ $t('player.totalKeeper') }}</div>
    </div>

    <div class="stat-tile" style="--accent: linear-gradient(135deg, #a855f7, #7e22ce)">
      <div class="stat-icon"><i class="pi pi-chart-line" /></div>
      <Skeleton v-if="loading" height="44px" width="72px" class="my-1" />
      <div v-else class="stat-value">{{ goalsPerMatch }}</div>
      <div class="stat-label">{{ $t('common.goalsPerMatch') }}</div>
    </div>

    <div
      class="stat-tile col-span-2 lg:col-span-1"
      style="--accent: linear-gradient(135deg, #22c55e, #15803d)"
    >
      <div class="stat-icon"><i class="pi pi-check-circle" /></div>
      <Skeleton v-if="loading" height="44px" width="56px" class="my-1" />
      <template v-else>
        <div class="stat-value">
          {{ attendancePercentage }}<span class="stat-sub">%</span>
        </div>
        <div class="attendance-bar">
          <div class="attendance-fill" :style="{ width: `${animatedBarWidth}%` }" />
        </div>
      </template>
      <div class="stat-label">{{ $t('common.attendancePercentage') }}</div>
    </div>
  </div>

  <!-- Info + chart -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <Card>
      <template #title>
        <h2>{{ $t('player.playerInfo') }}</h2>
      </template>
      <template #content>
        <Skeleton v-if="loading" height="120px" />
        <ul v-else class="info-list">
          <li>
            <span
              class="info-icon"
              style="background: linear-gradient(135deg, #3b82f6, #1d4ed8)"
            >
              <i class="pi pi-tag" />
            </span>
            <span class="info-key">{{ $t('common.clothingSize') }}</span>
            <span class="info-val">{{ player?.clothingSize ?? '-' }}</span>
          </li>
          <li>
            <span
              class="info-icon"
              style="background: linear-gradient(135deg, #f59e0b, #b45309)"
            >
              <i class="pi pi-user" />
            </span>
            <span class="info-key">{{ $t('common.hasJacket') }}</span>
            <span class="info-val" :class="player?.hasJacket ? 'yes' : 'no'">
              {{ player?.hasJacket ? $t('common.yes') : $t('common.no') }}
            </span>
          </li>
          <li>
            <span
              class="info-icon"
              style="background: linear-gradient(135deg, #14b8a6, #0f766e)"
            >
              <i class="pi pi-briefcase" />
            </span>
            <span class="info-key">{{ $t('common.hasBag') }}</span>
            <span class="info-val" :class="player?.hasBag ? 'yes' : 'no'">
              {{ player?.hasBag ? $t('common.yes') : $t('common.no') }}
            </span>
          </li>
          <li>
            <span
              class="info-icon"
              style="background: linear-gradient(135deg, #a855f7, #7e22ce)"
            >
              <i class="pi pi-users" />
            </span>
            <span class="info-key">{{ $t('player.guestPlayer') }}</span>
            <span class="info-val" :class="player?.guestPlayer ? 'yes' : 'no'">
              {{ player?.guestPlayer ? $t('common.yes') : $t('common.no') }}
            </span>
          </li>
        </ul>
      </template>
    </Card>

    <Card class="lg:col-span-2">
      <template #title>
        <h2>{{ $t('player.goalsTimeline') }}</h2>
      </template>
      <template #content>
        <Skeleton v-if="loading" height="160px" />
        <PlayerGoalsChart v-else :data="goalsChartData" />
      </template>
    </Card>
  </div>

  <!-- Edit dialog -->
  <Dialog
    v-model:visible="editVisible"
    modal
    :header="t('player.editPlayer')"
    :style="{ width: '400px' }"
    :draggable="false"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label for="name">{{ $t('common.name') }}</label>
        <InputText v-model="editForm.name" fluid input-id="name" />
      </div>
      <div>
        <label for="clothingSize">{{ $t('common.clothingSize') }}</label>
        <Select
          v-model="editForm.clothingSize"
          :options="['164', '158', '152', '146', '140', '134', '128']"
          :placeholder="$t('common.clothingSize')"
          input-id="clothingSize"
          fluid
        />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox v-model="editForm.hasJacket" binary input-id="hasJacket" />
        <label for="hasJacket">{{ $t('common.hasJacket') }}</label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox v-model="editForm.hasBag" binary input-id="hasBag" />
        <label for="hasBag">{{ $t('common.hasBag') }}</label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox v-model="editForm.guestPlayer" binary input-id="guestPlayer" />
        <label for="guestPlayer">{{ $t('player.guestPlayer') }}</label>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button
          :label="$t('common.cancel')"
          severity="secondary"
          text
          @click="editVisible = false"
        />
        <Button :label="$t('common.save')" icon="pi pi-check" @click="savePlayer" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* ── Hero ── */
.player-hero {
  background: linear-gradient(
    135deg,
    #111a36 0%,
    #1d2e5d 30%,
    #27428a 60%,
    #2f529f 80%,
    #4067b9 100%
  );
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(17, 26, 54, 0.3);
}

.hero-texture {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    -55deg,
    transparent,
    transparent 20px,
    rgba(255, 255, 255, 0.015) 20px,
    rgba(255, 255, 255, 0.015) 40px
  );
  pointer-events: none;
}

.hero-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  flex-wrap: wrap;
}

.hero-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 3px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 900;
  color: white;
  flex-shrink: 0;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  margin-top: 4px;
}

.hero-edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease;
  flex-shrink: 0;
}

.hero-edit-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.5);
}

/* ── Stat tiles ── */
.stat-tile {
  background: white;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 2px 12px rgba(39, 66, 138, 0.08);
  transition:
    box-shadow 0.22s ease,
    transform 0.22s ease;
}

.stat-tile:hover {
  box-shadow: 0 8px 28px rgba(39, 66, 138, 0.18);
  transform: translateY(-2px);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 900;
  color: #1d2e5d;
  line-height: 1;
}

.stat-sub {
  font-size: 1.1rem;
  font-weight: 500;
  color: #8da7df;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #6285d1;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 6px;
}

/* Attendance progress bar */
.attendance-bar {
  height: 4px;
  background: rgba(39, 66, 138, 0.1);
  border-radius: 999px;
  margin-top: 8px;
  overflow: hidden;
}

.attendance-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #15803d);
  border-radius: 999px;
  transition: width 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* ── Info list ── */
.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-list li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.72rem;
  flex-shrink: 0;
}

.info-key {
  flex: 1;
  font-size: 0.85rem;
  color: #4067b9;
  font-weight: 500;
}

.info-val {
  font-weight: 700;
  font-size: 0.875rem;
  color: #1d2e5d;
}

.info-val.yes {
  color: #15803d;
}

.info-val.no {
  color: #b91c1c;
}
</style>
