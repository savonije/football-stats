import { defineStore } from 'pinia'
import { getMatches, updateAppearance } from '@/services/matchService'
import {
  doc,
  getDoc,
  collection,
  getDocs,
  collectionGroup,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Match, Appearance } from '@/types'

export const useMatchStore = defineStore('matchStore', {
  state: () => ({
    matches: [] as Match[],
    loading: false,
    selectedMatch: null as Match | null,
    appearances: [] as Appearance[],
    loadingAppearances: false,
  }),
  actions: {
    async fetchMatches(seasonId: string) {
      this.loading = true
      this.matches = await getMatches(seasonId)
      this.loading = false
    },

    async fetchMatchDetails(seasonId: string, matchId: string) {
      this.loadingAppearances = true

      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
      const matchSnap = await getDoc(matchRef)

      if (!matchSnap.exists()) {
        console.warn('Match not found in Firestore')
        this.loadingAppearances = false
        return
      }

      this.selectedMatch = { id: matchSnap.id, ...matchSnap.data() } as Match

      const appearancesRef = collection(db, `seasons/${seasonId}/matches/${matchId}/appearances`)
      const snapshot = await getDocs(appearancesRef)

      this.appearances = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Appearance,
      )

      this.loadingAppearances = false
    },

    async fetchPlayerAppearances(seasonId: string, playerId: string) {
      this.loadingAppearances = true

      const q = query(collectionGroup(db, 'appearances'), where('seasonId', '==', seasonId))
      const snapshot = await getDocs(q)

      this.appearances = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Appearance)
        .filter((a) => a.playerId === playerId)

      this.loadingAppearances = false
    },

    async updateAppearance(
      seasonId: string,
      matchId: string,
      appearanceId: string,
      data: Partial<Appearance>,
    ) {
      try {
        await updateAppearance(seasonId, matchId, appearanceId, data)

        const idx = this.appearances.findIndex((a) => a.id === appearanceId)
        if (idx !== -1) {
          this.appearances[idx] = { ...this.appearances[idx], ...data }
        }
      } catch (err) {
        console.error('Error updating appearance:', err)
        throw err
      }
    },

    async deleteMatch(seasonId: string, matchId: string) {
      try {
        const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
        await deleteDoc(matchRef)

        this.matches = this.matches.filter((m) => m.id !== matchId)
        this.selectedMatch = null
        this.appearances = []
      } catch (err) {
        console.error('Error deleting match:', err)
      }
    },

    async deleteAppearance(seasonId: string, matchId: string, appearanceId: string) {
      try {
        const appearanceRef = doc(
          db,
          `seasons/${seasonId}/matches/${matchId}/appearances/${appearanceId}`,
        )
        await deleteDoc(appearanceRef)

        this.appearances = this.appearances.filter((a) => a.id !== appearanceId)
      } catch (err) {
        console.error('Error deleting appearance:', err)
      }
    },
  },
  getters: {
    totalGoalsPerPlayer: (state) => {
      return (playerId: string) => {
        const playerAppearances = state.appearances.filter(
          (a) => a.playerId === playerId && a.present,
        )
        return playerAppearances.reduce((sum, a) => sum + (a.goals || 0), 0)
      }
    },
    presentPlayers: (state) => state.appearances.filter((a) => a.present),
  },
})
