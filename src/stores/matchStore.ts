import { defineStore } from 'pinia'
import { getMatches } from '@/services/matchService'
import type { Match, Appearance } from '@/types'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

export const useMatchStore = defineStore('matchStore', {
  state: () => ({
    matches: [] as Match[],
    loading: false,
  }),
  getters: {
    goalsForPlayer: (state) => {
      return async (playerId: string) => {
        let totalGoals = 0

        for (const match of state.matches) {
          const appearancesRef = collection(db, `seasons/2025-2026/matches/${match.id}/appearances`)
          const snapshot = await getDocs(appearancesRef)

          snapshot.docs.forEach((doc) => {
            const data = doc.data() as Appearance
            if (data.playerId === playerId && data.present) {
              totalGoals += data.goals ?? 0
            }
          })
        }

        return totalGoals
      }
    },
  },
  actions: {
    async fetchMatches(seasonId: string) {
      this.loading = true
      this.matches = await getMatches(seasonId)
      this.loading = false
    },
  },
})
