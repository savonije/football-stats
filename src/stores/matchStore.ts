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
    timerInterval: ReturnType<typeof setInterval> | null
  } => ({
    matches: [],
    matchesLoaded: false,
    selectedMatch: null,
    appearances: [],
    appearancesLoaded: false,
    timerInterval: null as ReturnType<typeof setInterval> | null,
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

        // Auto-start local timer if match is running
        if (match?.running && !match.ended) {
          this.startTimer(seasonId, matchId)
        }
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

      updateDoc(matchRef, {
        running: true,
        ended: false,
      })

      this.startTimer(seasonId, matchId)
    },

    startTimer(seasonId: string, matchId: string) {
      if (this.timerInterval) return

      this.timerInterval = setInterval(() => {
        const match = this.selectedMatch
        if (!match || match.ended || match.paused || !match.running) {
          this.stopTimer()
          return
        }

        // Increment Firestore timer
        const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
        updateDoc(matchRef, {
          durationMinutes: increment(1),
        })
      }, 60000)
    },

    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },

    endMatch(seasonId: string, matchId: string) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)

      this.stopTimer()

      return updateDoc(matchRef, {
        ended: true,
        running: false,
      })
    },

    pauseMatch(seasonId: string, matchId: string) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)
      this.stopTimer()

      return updateDoc(matchRef, {
        paused: true,
        running: false,
      })
    },

    resumeMatch(seasonId: string, matchId: string) {
      const matchRef = doc(db, `seasons/${seasonId}/matches/${matchId}`)

      updateDoc(matchRef, {
        paused: false,
        running: true,
      })

      this.startTimer(seasonId, matchId)
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

    /** -----------------------------
     *  GOALS
     * ----------------------------- */

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
  },
})
