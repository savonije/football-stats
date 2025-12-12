import { defineStore } from 'pinia'
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Match, Appearance } from '@/types'
import { usePlayerStore } from '@/stores/playerStore'

export const useMatchStore = defineStore('matchStore', {
  state: (): {
    matches: Match[]
    matchesLoaded: boolean
    selectedMatch: Match | null
    appearances: Appearance[]
    appearancesLoaded: boolean
  } => ({
    matches: [],
    matchesLoaded: false,
    selectedMatch: null,
    appearances: [],
    appearancesLoaded: false,
  }),

  actions: {
    /** -----------------------------
     *  MATCHES
     * ----------------------------- */
    fetchMatches(seasonId: string) {
      const matchesRef = collection(db, `seasons/${seasonId}/matches`)
      onSnapshot(matchesRef, (snapshot) => {
        this.matchesLoaded = false
        this.matches = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Match)
        this.matchesLoaded = true
      })
    },

    fetchMatchDetails(seasonId: string, matchId: string) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)

      onSnapshot(matchRef, (snap) => {
        const match = snap.exists() ? ({ id: snap.id, ...snap.data() } as Match) : null
        this.selectedMatch = match
      })

      this.fetchAppearances(seasonId, matchId)
    },

    addMatch(seasonId: string, match: Match) {
      return setDoc(doc(db, `seasons/${seasonId}/matches`, match.id), match)
    },

    async deleteMatch(seasonId: string, matchId: string) {
      const appearancesRef = collection(db, `seasons/${seasonId}/matches/${matchId}/appearances`)
      const snapshot = await getDocs(appearancesRef)

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      await deleteDoc(doc(db, `seasons/${seasonId}/matches/${matchId}`))
    },

    /** -----------------------------
     *  MATCH TIMER CONTROL
     * ----------------------------- */

    startMatch(seasonId: string, matchId: string) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
      const now = Date.now()

      updateDoc(matchRef, {
        running: true,
        ended: false,
        paused: false,
        startTime: now,
        pausedDuration: 0,
        pausedAt: null,
      })
    },

    pauseMatch(seasonId: string, matchId: string) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
      const now = Date.now()

      updateDoc(matchRef, {
        paused: true,
        running: false,
        pausedAt: now,
      })
    },

    resumeMatch(seasonId: string, matchId: string) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
      const now = Date.now()
      const match = this.selectedMatch
      const pausedDuration = match?.pausedDuration ?? 0
      const pausedAt = match?.pausedAt ?? now

      updateDoc(matchRef, {
        paused: false,
        running: true,
        pausedDuration: pausedDuration + (now - pausedAt),
        pausedAt: null,
      })
    },

    endMatch(seasonId: string, matchId: string) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
      return updateDoc(matchRef, {
        ended: true,
        running: false,
        paused: false,
      })
    },

    /** -----------------------------
     *  APPEARANCES
     * ----------------------------- */
    fetchAppearances(seasonId: string, matchId?: string) {
      this.appearancesLoaded = false
      const q = matchId
        ? collection(db, `seasons/${seasonId}/matches/${matchId}/appearances`)
        : query(collectionGroup(db, 'appearances'), where('seasonId', '==', seasonId))

      onSnapshot(q, (snapshot) => {
        this.appearances = snapshot.docs.map((doc) => {
          const data = doc.data() as Appearance
          return {
            id: doc.id,
            playerId: data.playerId,
            seasonId: data.seasonId,
            matchId: data.matchId,
            present: data.present ?? false,
            goals: data.goals ?? 0,
            isGoalkeeper: data.isGoalkeeper ?? false,
          }
        })
        this.appearancesLoaded = true
      })
    },

    addAppearance(seasonId: string, matchId: string, appearance: Appearance) {
      return setDoc(
        doc(db, `seasons/${seasonId}/matches/${matchId}/appearances`, appearance.id),
        appearance,
      )
    },

    updateAppearance(
      seasonId: string,
      matchId: string,
      appearanceId: string,
      data: Partial<Appearance>,
    ) {
      return updateDoc(
        doc(db, `seasons/${seasonId}/matches/${matchId}/appearances/${appearanceId}`),
        data,
      )
    },

    deleteAppearance(seasonId: string, matchId: string, appearanceId: string) {
      return deleteDoc(
        doc(db, `seasons/${seasonId}/matches/${matchId}/appearances/${appearanceId}`),
      )
    },

    updateMatchGoals(seasonId: string, matchId: string, type: 'for' | 'against', goals: number) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
      return updateDoc(matchRef, {
        [`result.${type === 'for' ? 'goalsFor' : 'goalsAgainst'}`]: goals,
      })
    },

    incrementPlayerGoals(seasonId: string, matchId: string, appearanceId: string, delta = 1) {
      const appearanceRef = doc(
        db,
        `seasons/${seasonId}/matches/${matchId}/appearances/${appearanceId}`,
      )
      return updateDoc(appearanceRef, {
        goals: increment(delta),
      })
    },
  },

  getters: {
    totalGoalsPerPlayer: (state) => (playerId: string) =>
      state.appearances
        .filter((a) => a.playerId === playerId && a.present)
        .reduce((sum, a) => sum + (a.goals || 0), 0),

    presentPlayers: (state) => state.appearances.filter((a) => a.present),

    presentPlayersWithNames: (state) => {
      const playerStore = usePlayerStore()
      return state.appearances
        .filter((a) => a.present)
        .map((a) => ({
          ...a,
          playerName: playerStore.getPlayerById(a.playerId)?.name ?? '',
        }))
    },

    getMatchDuration: () => (match: Match) => {
      if (!match.startTime) return 0
      const now = Date.now()
      let elapsed = now - match.startTime

      if (match.paused && match.pausedAt) {
        elapsed -= (match.pausedDuration ?? 0) + (now - match.pausedAt)
      } else {
        elapsed -= match.pausedDuration ?? 0
      }

      return Math.floor(elapsed / 60000) // minutes
    },
  },
})
